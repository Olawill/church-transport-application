import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/client";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth();

    if (!session?.user?.role || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.status !== "BANNED") {
      return NextResponse.json(
        {
          error: "Only banned users can be unbanned",
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: "APPROVED",
        isActive: true,
        bannedAt: null,
        bannedBy: null,
        banReason: null,
      },
    });

    // Track analytics
    await AnalyticsService.trackEvent({
      eventType: "user_unban",
      userId: id,
      metadata: { unbannedBy: session.user.id },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("User unban error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
