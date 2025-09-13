import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocoding";
import { signupSchema } from "@/types/authSchemas";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate required fields
    const validatedBody = signupSchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: "Error validating form fields" },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      street,
      city,
      province,
      postalCode,
    } = validatedBody.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get coordinates for address
    const coordinates = await geocodeAddress({
      street,
      city,
      province,
      postalCode,
      country: "Canada",
    });

    if (coordinates == null) {
      return NextResponse.json(
        { error: "Invalid address information" },
        { status: 400 }
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: "USER",
        status: "PENDING", // Requires admin approval
      },
    });

    // Create default address
    await prisma.address.create({
      data: {
        userId: user.id,
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

    // Track user registration event
    await AnalyticsService.trackUserRegistration(user.id, "email");

    return NextResponse.json(
      {
        message: "Registration successful. Please wait for admin approval.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
