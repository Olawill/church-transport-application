import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";

import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { calculateDistance } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export const PUT = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, driverId } = body;

    if (!id || !driverId) {
      return NextResponse.json(
        { error: "Request ID or Driver ID is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const existingRequest = await prisma.pickupRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    let distance = null;
    const driverAddress = await prisma.address.findFirst({
      where: {
        userId: driverId,
        isDefault: true,
      },
    });

    const userAddress = await prisma.address.findFirst({
      where: {
        id: existingRequest.addressId,
      },
    });

    if (
      driverAddress &&
      userAddress &&
      driverAddress.latitude != null &&
      driverAddress.longitude != null &&
      userAddress.latitude != null &&
      userAddress.longitude != null
    ) {
      distance = calculateDistance(
        driverAddress?.latitude,
        driverAddress?.longitude,
        userAddress?.latitude,
        userAddress?.longitude
      );
    }

    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: {
        status,
        driverId,
        distance,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        serviceDay: true,
        address: true,
      },
    });

    // Track events based on status changes
    await AnalyticsService.trackEvent({
      eventType: "driver_assigned",
      userId: driverId,
      metadata: {
        requestId: id,
        assignedBy: session.user.id,
        timestamp: new Date().toISOString(),
      },
    });

    revalidatePath("/requests");

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
