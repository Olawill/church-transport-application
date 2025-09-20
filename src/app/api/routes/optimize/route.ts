import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

import { optimizeRoute } from "@/lib/route-optimization";
import { setTenantContext } from "@/lib/tenant";

// Optimize route for pickup requests
export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only admins and drivers can optimize routes
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.TRANSPORTATION_TEAM
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await setTenantContext(session.user.id);

    const {
      driverId,
      serviceDayId,
      routeDate,
      pickupRequestIds,
      startLocation,
    } = await request.json();

    if (
      !driverId ||
      !serviceDayId ||
      !routeDate ||
      !pickupRequestIds ||
      !startLocation
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate start location
    if (!startLocation.lat || !startLocation.lng) {
      return NextResponse.json(
        { error: "Invalid start location coordinates" },
        { status: 400 }
      );
    }

    const routeId = await optimizeRoute(
      session.user.organizationId!,
      driverId,
      serviceDayId,
      new Date(routeDate),
      pickupRequestIds,
      startLocation
    );

    return NextResponse.json({
      success: true,
      routeId,
      message: "Route optimized successfully",
    });
  } catch (error) {
    console.error("Route optimization error:", error);
    return NextResponse.json(
      { error: "Failed to optimize route" },
      { status: 500 }
    );
  }
};
