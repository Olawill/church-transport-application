//api/admin/users/pickup-request/route.ts
import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { PickupRequest, UserRole } from "@/generated/prisma";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocoding";
import { validateRequest } from "@/types/newRequestSchema";
import bcrypt from "bcryptjs";
import { getNextOccurrencesOfWeekdays } from "@/lib/utils";

const payloadSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    phone: z.string().optional().nullable(),
    isLoginRequired: z.boolean(),
    password: z.string().optional(),
    street: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    postalCode: z.string().min(1),
    serviceDayId: z.string().min(1),
    // requestDate: z.union([z.string(), z.date()]),
    requestDate: z.date(),
    notes: z.string().optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
    isGroupRide: z.boolean(),
    numberOfGroup: z.number().int().min(2).max(10).nullable(),
    isRecurring: z.boolean(),
    endDate: z.date().optional(),
  })
  .superRefine(validateRequest);

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }
    const {
      firstName,
      lastName,
      email,
      phone,
      isLoginRequired,
      password,
      street,
      city,
      province,
      postalCode,
      serviceDayId,
      requestDate,
      notes,
      isPickUp,
      isDropOff,
      isGroupRide,
      numberOfGroup,
      isRecurring,
      endDate,
    } = parsed.data;

    // Check if user already exist
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    //Hash password
    let hashedPassword: string | null = null;
    if (isLoginRequired) {
      if (!password || password.length < 8) {
        return NextResponse.json(
          { error: "Password is required and must be at least 8 characters" },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(12);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Get coordinates for addresses
    const coordinates = await geocodeAddress({
      street,
      city,
      province,
      postalCode,
      country: "Canada",
    });

    if (coordinates === null) {
      return NextResponse.json(
        { error: "Invalid address information" },
        { status: 400 }
      );
    }

    // Create user and address using transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          password: hashedPassword,
          role: "USER",
          status: "APPROVED",
        },
      });

      // Create default address
      const newAddress = await tx.address.create({
        data: {
          userId: newUser.id,
          name: "Home",
          street,
          city,
          province,
          postalCode,
          country: "Canada",
          latitude: coordinates?.latitude || null,
          longitude: coordinates?.longitude || null,
          isDefault: true,
        },
      });
      return { newUser, newAddress };
    });

    //
    const { newUser, newAddress } = result;

    // Track user creating by admin event
    await AnalyticsService.trackEvent({
      eventType: "admin_user_creation",
      userId: newUser.id,
      metadata: { createdBy: session.user.id },
    });

    if (!newUser.id || !serviceDayId || !newAddress.id || !requestDate) {
      return NextResponse.json(
        {
          error: "User, Service day, address, and request date are required",
        },
        { status: 400 }
      );
    }

    // Check cutoff: 1 hour before the service start time for the selected date
    const serviceDateTime = new Date(requestDate);
    const serviceDay = await prisma.serviceDay.findUnique({
      where: { id: serviceDayId },
    });
    if (!serviceDay) {
      return NextResponse.json(
        { error: "Invalid service day" },
        { status: 400 }
      );
    }
    const [hh, mm] = serviceDay.time.split(":").map((n) => parseInt(n, 10));
    const serviceStart = new Date(serviceDateTime);
    serviceStart.setHours(hh || 0, mm || 0, 0, 0);
    const cutoff = new Date(serviceStart.getTime() - 60 * 60 * 1000);

    if (Date.now() > cutoff.getTime()) {
      return NextResponse.json(
        {
          error: "Cannot request pickup less than 1 hour before service time",
        },
        { status: 400 }
      );
    }

    // Check if user already has a request for this service day and date
    const existingRequest = await prisma.pickupRequest.findFirst({
      where: {
        userId: newUser.id,
        serviceDayId,
        requestDate: serviceDateTime,
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pickup request for this service" },
        { status: 400 }
      );
    }

    if (isRecurring && !endDate) {
      return NextResponse.json(
        { error: "You need to have an end date to create recurring requests" },
        { status: 400 }
      );
    }

    let allRequests: PickupRequest[] = [];
    let seriesId: string | null = null;

    if (!isRecurring) {
      const pickupRequest = await prisma.pickupRequest.create({
        data: {
          userId: newUser.id,
          serviceDayId,
          addressId: newAddress.id,
          requestDate: serviceDateTime,
          notes: notes || null,
          status: "PENDING",
          isPickUp,
          isDropOff,
          isGroupRide,
          numberOfGroup,
        },
        include: {
          serviceDay: true,
          address: true,
        },
      });
      allRequests.push(pickupRequest);
    } else {
      const allRequestDates = getNextOccurrencesOfWeekdays({
        fromDate: serviceDateTime,
        allowedWeekdays: [serviceDay.dayOfWeek],
        count: 1,
        endDate,
      });

      // use Transaction to create many request
      const { series, requests } = await prisma.$transaction(async (tx) => {
        // 1️⃣ Create the series first
        const series = await tx.pickupSeries.create({
          data: {},
        });

        // 2️⃣ Create all related pickup requests referencing the same seriesId
        const requests = await Promise.all(
          allRequestDates.map((d) =>
            tx.pickupRequest.create({
              data: {
                userId: newUser.id,
                serviceDayId,
                addressId: newAddress.id,
                requestDate: d,
                isPickUp,
                isDropOff,
                notes: notes || null,
                status: "PENDING",
                isGroupRide,
                numberOfGroup,
                seriesId: series.id, // link to the series
              },
              include: {
                serviceDay: true,
                address: true,
              },
            })
          )
        );

        return { series, requests };
      });
      allRequests = requests;
      seriesId = series.id;
    }

    // Track pickup request creation
    if (!isRecurring) {
      await AnalyticsService.trackEvent({
        eventType: "admin_user_pickup_request_created",
        userId: newUser.id,
        metadata: {
          adminId: session.user.id,
          requestId: allRequests[0].id,
          serviceDayId,
          addressId: newAddress.id,
        },
      });
    } else {
      await AnalyticsService.trackEvent({
        eventType: "admin_user_recurring_pickup_request_created",
        userId: newUser.id,
        metadata: {
          adminId: session.user.id,
          seriesId,
          serviceDayId,
          addressId: newAddress.id,
        },
      });
    }

    return NextResponse.json(allRequests, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
