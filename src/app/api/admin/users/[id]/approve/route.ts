import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
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

    if (user.status !== "PENDING") {
      return NextResponse.json(
        {
          error: "Only pending users can be approved",
        },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: "APPROVED",
        isActive: true,
      },
    });

    // Track analytics
    await AnalyticsService.trackEvent({
      eventType: "user_approval",
      userId: id,
      metadata: { approvedBy: session.user.id },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("User approval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
