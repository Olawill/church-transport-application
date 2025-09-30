import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";

interface UpdatedDataType {
  firstName: string;
  lastName: string;
  username: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  image?: string | undefined;
}

export const GET = async () => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        username: true,
        image: true,
        whatsappNumber: true,
        twoFactorEnabled: true,
        emailVerified: true,
        phoneVerified: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, userName, phone, whatsappNumber, image } =
      body;

    // Validate username uniqueness if provided
    if (userName) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: userName,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }

    const updateData: UpdatedDataType = {
      firstName,
      lastName,
      username: userName || null,
      phone: phone || null,
      whatsappNumber: whatsappNumber || null,
    };

    // Handle image upload if provided
    if (image && image.size > 0) {
      // TODO: Implement cloud storage for profile images
      // For now, we'll just store a placeholder
      updateData.image = `/uploads/profiles/${session.user.id}-${Date.now()}.jpg`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        username: true,
        image: true,
        whatsappNumber: true,
        twoFactorEnabled: true,
        emailVerified: true,
        phoneVerified: true,
        role: true,
        status: true,
      },
    });

    // Track analytics
    await AnalyticsService.trackEvent({
      eventType: "profile_update",
      userId: session.user.id,
      metadata: { fields: Object.keys(updateData) },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
