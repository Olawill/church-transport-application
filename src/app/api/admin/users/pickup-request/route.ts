//api/admin/users/pickup-request/route.ts

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { geocodeAddress } from "@/lib/geocoding";
import { AnalyticsService } from "@/lib/analytics";

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
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
    } = body;

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
    let hashedPassword = "";
    if (isLoginRequired && password && password.length >= 8) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Get coordinates for addresses
    const coordiantes = await geocodeAddress({
      street,
      city,
      province,
      postalCode,
      country: "Canada",
    });

    if (coordiantes === null) {
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
          password: isLoginRequired ? hashedPassword : null,
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
          latitude: coordiantes?.latitude || null,
          longitude: coordiantes?.longitude || null,
          isDefault: true,
        },
      });
      return { newUser, newAddress };
    });

    //
    const { newUser, newAddress } = result;

    // Track user creatin by admin event
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

    // Check if it's too late to request pickup (less than 1 hour before service)
    const serviceDateTime = new Date(requestDate);
    const oneHoursBefore = new Date(
      serviceDateTime.getTime() - 1 * 60 * 60 * 1000
    );

    if (new Date() > oneHoursBefore) {
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

    const pickupRequest = await prisma.pickupRequest.create({
      data: {
        userId: newUser.id,
        serviceDayId,
        addressId: newAddress.id,
        requestDate: serviceDateTime,
        notes: notes || null,
        status: "PENDING",
      },
      include: {
        serviceDay: true,
        address: true,
      },
    });

    // Track pickup request creation
    await AnalyticsService.trackPickupRequest(
      newUser.id,
      pickupRequest.id,
      serviceDayId,
      newAddress.id
    );

    return NextResponse.json(pickupRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
