import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { getDriverRoutes, getRouteAnalytics } from "@/lib/route-optimization";
import { setTenantContext } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await setTenantContext(session.user.id);

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const analytics = searchParams.get("analytics") === "true";

    // If requesting analytics
    if (analytics) {
      if (session.user.role === UserRole.USER) {
        return NextResponse.json(
          { error: "Insufficient permissions for analytics" },
          { status: 403 }
        );
      }

      const fromDate = dateFrom
        ? new Date(dateFrom)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = dateTo ? new Date(dateTo) : new Date();

      const routeAnalytics = await getRouteAnalytics(
        session.user.organizationId!,
        fromDate,
        toDate
      );

      return NextResponse.json({
        success: true,
        analytics: routeAnalytics,
      });
    }

    // Get routes
    let targetDriverId = driverId;

    // If user is a driver and no driverId specified, show their own routes
    if (session.user.role === UserRole.TRANSPORTATION_TEAM && !driverId) {
      targetDriverId = session.user.id;
    }

    // Users can only see their own requests (handled in getDriverRoutes)
    if (session.user.role === UserRole.USER && !driverId) {
      return NextResponse.json(
        { error: "Driver ID required for route lookup" },
        { status: 400 }
      );
    }

    const routes = await getDriverRoutes(
      session.user.organizationId!,
      targetDriverId || session.user.id,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined
    );

    return NextResponse.json({
      success: true,
      routes,
    });
  } catch (error) {
    console.error("Get routes error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve routes" },
      { status: 500 }
    );
  }
};
