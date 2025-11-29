//api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";

import { UserRole } from "@/generated/prisma/client";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocoding";
import { getAuthSession } from "@/lib/session/server-session";
import bcrypt from "bcryptjs";

export const GET = async () => {
  try {
    const session = await getAuthSession();

    if (!session?.user?.role || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        bannedAt: true,
        banReason: true,
        isActive: true,
      },
      orderBy: [
        { status: "asc" }, // Pending first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const session = await getAuthSession();

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
    let hashedPassword: string | null = null;
    if (isLoginRequired) {
      if (!password || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
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

    const newUser = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        phoneNumber: phone || null,
        password: hashedPassword,
        role: "USER",
        status: "APPROVED",
      },
    });

    // Create default address
    await prisma.address.create({
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

    // Track user creating by admin event
    await AnalyticsService.trackEvent({
      eventType: "admin_user_creation",
      userId: newUser.id,
      metadata: { createdBy: session.user.id },
    });

    return NextResponse.json({
      message: "User Created Successfully.",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
