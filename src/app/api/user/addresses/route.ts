import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const GET = async () => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Addresses fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, street, city, province, postalCode, country } =
      await request.json();

    // Validate required fields
    if (!name || !street || !city || !province || !postalCode) {
      return NextResponse.json(
        {
          error: "All address fields are required",
        },
        { status: 400 }
      );
    }

    // Check if user already has an address with this name
    const existingAddress = await prisma.address.findFirst({
      where: {
        userId: session.user.id,
        name,
        isActive: true,
      },
    });

    if (existingAddress) {
      return NextResponse.json(
        {
          error: "You already have an address with this name",
        },
        { status: 400 }
      );
    }

    // Check if this is the user's first address
    const addressCount = await prisma.address.count({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    const isFirstAddress = addressCount === 0;

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        name,
        street,
        city,
        province,
        postalCode,
        country: country || "Canada",
        isDefault: isFirstAddress, // First address becomes default
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error("Address creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
