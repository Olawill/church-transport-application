//api/admin/users/pickup-request/route.ts
import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { PickupRequest, UserRole } from "@/generated/prisma";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocoding";
import { serverValidateRequest } from "@/types/newRequestSchema";
import bcrypt from "bcryptjs";
import { getNextOccurrencesOfWeekdays } from "@/lib/utils";
import {
  convertStringDateToDate,
  TRANSACTION_CONFIG,
  validateDayOfWeek,
  validateEndDateLimit,
  validatePickUpRequestTiming,
} from "@/lib/pickup-utils";

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
    requestDate: z.string(),
    notes: z.string().optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
    isGroupRide: z.boolean(),
    numberOfGroup: z.number().int().min(2).max(10).nullable(),
    isRecurring: z.boolean(),
    endDate: z.string().optional(),
  })
  .superRefine(serverValidateRequest);

const validatePassword = (isLoginRequired: boolean, password?: string) => {
  if (isLoginRequired && (!password || password.length < 8)) {
    return {
      valid: false,
      error: "Password is required and must be at least 8 characters",
    };
  }
  return { valid: true };
};

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = await payloadSchema.safeParseAsync(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
        },
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

    // Early validation
    const passwordValidation = validatePassword(isLoginRequired, password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Convert requestDate
    const normalizedRequestDate = convertStringDateToDate(requestDate);
    // Convert endDate
    const normalizedEndDate = endDate
      ? convertStringDateToDate(endDate)
      : undefined;

    // Validate endDate limit
    const endDateValidation = validateEndDateLimit(
      normalizedEndDate,
      normalizedRequestDate,
      isRecurring
    );
    if (!endDateValidation.valid) {
      return NextResponse.json(
        { error: endDateValidation.error },
        { status: 400 }
      );
    }

    // OPTIMIZATION 3: Parallel validation queries (user + serviceDay)
    const [existingUser, serviceDay] = await Promise.all([
      prisma.user.findUnique({
        where: { email },
        select: { id: true }, // Only fetch what we need
      }),
      prisma.serviceDay.findUnique({
        where: { id: serviceDayId },
      }),
    ]);

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    if (!serviceDay) {
      return NextResponse.json(
        { error: "Invalid service day" },
        { status: 400 }
      );
    }

    const dayValidation = validateDayOfWeek(serviceDay, normalizedRequestDate);
    if (!dayValidation.valid) {
      return NextResponse.json({ error: dayValidation.error }, { status: 400 });
    }

    const timingValidation = validatePickUpRequestTiming(
      serviceDay,
      normalizedRequestDate
    );
    if (!timingValidation.valid) {
      return NextResponse.json(
        { error: timingValidation.error },
        { status: 400 }
      );
    }

    // Parallel processing of password hashing and geocoding
    const [hashedPassword, coordinates] = await Promise.all([
      isLoginRequired && password
        ? bcrypt.hash(password, 12)
        : Promise.resolve(null),
      geocodeAddress({
        street,
        city,
        province,
        postalCode,
        country: "Canada",
      }),
    ]);

    // Verify coordinates
    if (coordinates === null) {
      return NextResponse.json(
        { error: "Invalid address - unable to geocode location" },
        { status: 400 }
      );
    }

    // Calculate request dates before transaction
    let allRequestDates: Date[] = [];
    if (isRecurring && endDate) {
      allRequestDates = getNextOccurrencesOfWeekdays({
        fromDate: normalizedRequestDate,
        allowedWeekdays: [serviceDay.dayOfWeek],
        count: 1,
        endDate: normalizedEndDate,
      });
    }

    // Single comprehensive transaction for ALL operations
    const { newUser, newAddress, allRequests, seriesId } =
      await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            phone: phone,
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
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            isDefault: true,
          },
        });

        // Check for duplicate request (within transaction for consistency)
        const existingRequest = await tx.pickupRequest.findFirst({
          where: {
            userId: newUser.id,
            serviceDayId,
            requestDate: normalizedRequestDate,
          },
          select: { id: true },
        });

        if (existingRequest) {
          throw new Error("Duplicate pickup request for this service");
        }

        let allRequests: PickupRequest[] = [];
        let seriesId: string | null = null;

        if (!isRecurring) {
          // Create single pickup request
          const pickupRequest = await tx.pickupRequest.create({
            data: {
              userId: newUser.id,
              serviceDayId,
              addressId: newAddress.id,
              requestDate: normalizedRequestDate,
              notes,
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
          // Create series
          const series = await tx.pickupSeries.create({
            data: {},
          });
          seriesId = series.id;

          // Create all recurring requests in parallel
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
                  notes,
                  status: "PENDING",
                  isGroupRide,
                  numberOfGroup,
                  seriesId: series.id,
                },
                include: {
                  serviceDay: true,
                  address: true,
                },
              })
            )
          );
          allRequests = requests;
        }

        return { newUser, newAddress, allRequests, seriesId };
      }, TRANSACTION_CONFIG);

    // Fire-and-forget analytics (don't block response)
    const analyticsPromises = [
      AnalyticsService.trackEvent({
        eventType: "admin_user_creation",
        userId: newUser.id,
        metadata: { createdBy: session.user.id },
      }),
      isRecurring
        ? AnalyticsService.trackEvent({
            eventType: "admin_user_recurring_pickup_request_created",
            userId: newUser.id,
            metadata: {
              adminId: session.user.id,
              seriesId,
              serviceDayId,
              addressId: newAddress.id,
            },
          })
        : AnalyticsService.trackEvent({
            eventType: "admin_user_pickup_request_created",
            userId: newUser.id,
            metadata: {
              admin: session.user.id,
              requestId: allRequests[0].id,
              serviceDayId,
              addressId: newAddress.id,
            },
          }),
    ];

    Promise.all(analyticsPromises).catch((err) =>
      console.error("Analytics tracking failed:", err)
    );

    // Return structured response with user info
    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
        address: {
          id: newAddress.id,
          street: newAddress.street,
          city: newAddress.city,
        },
        requests: allRequests,
        seriesId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user and pickup request:", error);

    // OPTIMIZATION 11: Better error handling with specific messages
    if (error instanceof Error) {
      if (error.message.includes("Duplicate pickup request")) {
        return NextResponse.json(
          { error: "You already have a pickup request for this service" },
          { status: 400 }
        );
      }
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 400 }
        );
      }

      // Add more specific Prisma error handling
      if (error.message.includes("Transaction")) {
        return NextResponse.json(
          {
            error: "Database transaction failed. No data was created.",
            code: "TRANSACTION_FAILED",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
