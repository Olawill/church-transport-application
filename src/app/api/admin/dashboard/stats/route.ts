import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";

export const GET = async () => {
  try {
    const session = await auth();

    if (!session?.user?.role || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      bannedUsers,
      totalRequests,
      completedRequests,
      pendingRequests,
      cancelledRequests,
      totalDrivers,
      activeDrivers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "APPROVED", isActive: true } }),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "BANNED" } }),
      prisma.pickupRequest.count(),
      prisma.pickupRequest.count({ where: { status: "COMPLETED" } }),
      prisma.pickupRequest.count({ where: { status: "PENDING" } }),
      prisma.pickupRequest.count({ where: { status: "CANCELLED" } }),
      prisma.user.count({ where: { role: "TRANSPORTATION_TEAM" } }),
      prisma.user.count({
        where: {
          role: "TRANSPORTATION_TEAM",
          status: "APPROVED",
          isActive: true,
        },
      }),
    ]);

    const completionRate =
      totalRequests > 0
        ? ((completedRequests / totalRequests) * 100).toFixed(1)
        : "0";

    const stats = {
      totalUsers,
      activeUsers,
      pendingUsers,
      bannedUsers,
      totalRequests,
      completedRequests,
      pendingRequests,
      cancelledRequests,
      totalDrivers,
      activeDrivers,
      completionRate,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
