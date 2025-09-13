import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const session = await auth();

    if (!session?.user || session?.user.role !== UserRole.TRANSPORTATION_TEAM) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get statistics for the transportation team member
    const [
      myActiveRequests,
      availableRequests,
      completedToday,
      totalCompleted,
    ] = await Promise.all([
      // My accepted requests that are not completed
      prisma.pickupRequest.count({
        where: {
          driverId: userId,
          status: "ACCEPTED",
        },
      }),

      // Available requests (pending and within reasonable distance - all pending for now)
      prisma.pickupRequest.count({
        where: {
          status: "PENDING",
        },
      }),

      // Completed requests by me today
      prisma.pickupRequest.count({
        where: {
          driverId: userId,
          status: "COMPLETED",
          updatedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // Total completed requests by me
      prisma.pickupRequest.count({
        where: {
          driverId: userId,
          status: "COMPLETED",
        },
      }),
    ]);

    return NextResponse.json({
      myActiveRequests,
      availableRequests,
      completedToday,
      totalCompleted,
    });
  } catch (error) {
    console.error("Error fetching pickup request stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
