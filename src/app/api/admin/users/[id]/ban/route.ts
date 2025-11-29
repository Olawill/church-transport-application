import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/client";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.role || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { reason } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Ban reason is required",
        },
        { status: 400 }
      );
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === UserRole.ADMIN) {
      return NextResponse.json(
        {
          error: "Cannot ban admin users",
        },
        { status: 400 }
      );
    }

    if (user.status === "BANNED") {
      return NextResponse.json(
        {
          error: "User is already banned",
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: "BANNED",
        isActive: false,
        bannedAt: new Date(),
        bannedBy: session.user.id,
        banReason: reason.trim(),
      },
    });

    // Cancel any pending pickup requests
    await prisma.pickupRequest.updateMany({
      where: {
        userId: id,
        status: "PENDING",
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Track analytics
    await AnalyticsService.trackEvent({
      eventType: "user_ban",
      userId: id,
      metadata: {
        bannedBy: session.user.id,
        reason: reason.trim(),
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("User ban error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
