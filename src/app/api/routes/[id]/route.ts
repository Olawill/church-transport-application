import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

import { getOptimizedRoute, updateRouteStatus } from "@/lib/route-optimization";
import { setTenantContext } from "@/lib/tenant";

// Get route details
export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await setTenantContext(session.user.id);

    const routeId = params.id;

    const route = await getOptimizedRoute(routeId);

    // Check access permissions
    if (
      session.user.role === UserRole.TRANSPORTATION_TEAM &&
      route.driverId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Access denied to this route" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      route,
    });
  } catch (error) {
    console.error("Get route error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve route" },
      { status: 500 }
    );
  }
};

// Update route status
export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await setTenantContext(session.user.id);

    const routeId = params.id;
    const { status, actualStartTime, actualEndTime } = await request.json();

    // Get route to verify permissions
    const route = await getOptimizedRoute(routeId);

    if (
      session.user.role === UserRole.TRANSPORTATION_TEAM &&
      route.driverId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Access denied to this route" },
        { status: 403 }
      );
    }

    const updatedRoute = await updateRouteStatus(
      routeId,
      status,
      actualStartTime ? new Date(actualStartTime) : undefined,
      actualEndTime ? new Date(actualEndTime) : undefined
    );

    return NextResponse.json({
      success: true,
      route: updatedRoute,
    });
  } catch (error) {
    console.error("Update route error:", error);
    return NextResponse.json(
      { error: "Failed to update route" },
      { status: 500 }
    );
  }
};
