import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { AnalyticsService } from "@/lib/analytics";

export const GET = async () => {
  try {
    const session = await auth();

    if (!session?.user?.role || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // console.log({ user: session.user });

    const [registrations, pickupRequests, driverActivity, popularServiceDays] =
      await Promise.all([
        AnalyticsService.getUserRegistrationStats(30),
        AnalyticsService.getPickupRequestStats(30),
        AnalyticsService.getDriverActivityStats(30),
        AnalyticsService.getPopularServiceDays(),
      ]);

    const analytics = {
      registrations,
      pickupRequests,
      driverActivity,
      popularServiceDays,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
