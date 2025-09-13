import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get Dashboard Statistics
    const [
      totalUsers,
      pendingUsers,
      totalRequests,
      pendingRequests,
      completedRequests,
      activeDrivers,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: UserRole.USER },
      }),
      prisma.user.count({
        where: {
          role: UserRole.USER,
          status: "PENDING",
        },
      }),
      prisma.pickupRequest.count(),
      prisma.pickupRequest.count({
        where: { status: "PENDING" },
      }),
      prisma.pickupRequest.count({
        where: { status: "COMPLETED" },
      }),
      prisma.user.count({
        where: {
          role: UserRole.TRANSPORTATION_TEAM,
          isActive: true,
        },
      }),
    ]);

    const stats = {
      totalUsers,
      pendingUsers,
      totalRequests,
      pendingRequests,
      completedRequests,
      activeDrivers,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
