import { auth } from "@/auth";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { NotificationService } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; driverId: string }> }
) => {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reason } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Cancellation reason is required",
        },
        { status: 400 }
      );
    }

    const { id, driverId } = await params;

    if (driverId !== session.user.id) {
      return NextResponse.json(
        {
          error: "Not authorized",
        },
        { status: 404 }
      );
    }

    const pickupRequest = await prisma.pickupRequest.findFirst({
      where: {
        id,
        driverId, // Only allow drivers to cancel the requests they have accepted
        status: "ACCEPTED",
      },
      include: {
        driver: true,
        serviceDay: true,
      },
    });

    if (!pickupRequest) {
      return NextResponse.json(
        {
          error: "Pickup request not found or not authorized",
        },
        { status: 404 }
      );
    }

    // Check if request can be cancelled
    if (pickupRequest.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "Cannot cancel completed requests",
        },
        { status: 400 }
      );
    }

    if (pickupRequest.status === "CANCELLED") {
      return NextResponse.json(
        {
          error: "Request is already cancelled",
        },
        { status: 400 }
      );
    }

    // Check if it's too late to cancel (less than 2 hours before service)
    const serviceDateTime = new Date(pickupRequest.requestDate);
    const serviceDay = await prisma.serviceDay.findUnique({
      where: { id: pickupRequest.serviceDay.id },
    });
    if (!serviceDay) {
      return NextResponse.json(
        { error: "Invalid service day" },
        { status: 400 }
      );
    }
    const [hh, mm] = serviceDay.time.split(":").map((n) => parseInt(n, 10));
    const serviceStart = new Date(serviceDateTime);
    serviceStart.setHours(hh || 0, mm || 0, 0, 0);
    const cutoff = new Date(serviceStart.getTime() - 2 * 60 * 60 * 1000);

    if (pickupRequest.status === "ACCEPTED" && Date.now() > cutoff.getTime()) {
      return NextResponse.json(
        {
          error:
            "Cannot cancel accepted requests less than 2 hours before service time",
        },
        { status: 400 }
      );
    }

    // Update the request status
    const [updatedRequest] = await prisma.$transaction([
      prisma.pickupRequest.update({
        where: { id },
        data: {
          status: "PENDING",
          driverId: null, // Remove driver assignment
          distance: null,
        },
        include: {
          user: true,
          driver: true,
          serviceDay: true,
          address: true,
        },
      }),

      // Update the driver request cancellation table
      prisma.driverRequestCancel.create({
        data: {
          driverId,
          requestId: id,
          note: reason.trim(),
        },
      }),
    ]);

    // Notify the user pickup was cancelled by driver
    await NotificationService.scheduleWhatsAppNotification(
      updatedRequest.userId,
      {
        to:
          updatedRequest.user.whatsappNumber ||
          updatedRequest.user.phoneNumber ||
          "",
        type: "text",
        text: `Hello ${updatedRequest.user.name}! The pickup request for ${pickupRequest.serviceDay?.name} has been cancelled by the driver. Reason: ${reason.trim()}. Another driver will be assigned shortly.`,
      }
    );

    // Track analytics
    await AnalyticsService.trackEvent({
      eventType: "driver_pickup_cancellation",
      userId: session.user.id,
      metadata: {
        requestId: id,
        reason: reason.trim(),
        previousStatus: pickupRequest.status,
        updatedStatus: updatedRequest.status,
        hadDriver: !!pickupRequest.driver,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pickup cancelled successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Cancel pickup error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};
