import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { NotificationService } from "@/lib/notifications";

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth();

    if (!session?.user.id || session.user.role === "TRANSPORTATION_TEAM") {
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

    const { id } = await params;
    const where =
      session.user.role === "ADMIN" ? { id } : { id, userId: session.user.id };

    const pickupRequest = await prisma.pickupRequest.findFirst({
      where,
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
    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: `${pickupRequest.notes ? pickupRequest.notes + "\n\n" : ""}CANCELLED: ${reason.trim()}`,
        driverId: null, // Remove driver assignment
      },
      include: {
        user: true,
        driver: true,
        serviceDay: true,
        address: true,
      },
    });

    // Notify the driver if request was accepted
    if (pickupRequest.driver && pickupRequest.status === "ACCEPTED") {
      const text = `Hello ${pickupRequest.driver.name}! The pickup request you accepted for ${pickupRequest.serviceDay?.name} has been cancelled by the ${session.user.role === "USER" ? "user" : "admin"}. Reason: ${reason.trim()}`;
      await NotificationService.scheduleWhatsAppNotification(
        pickupRequest.driver.id,
        {
          to:
            pickupRequest.driver.whatsappNumber ||
            pickupRequest.driver.phoneNumber ||
            "",
          type: "text",
          text,
        }
      );
    }

    const metadata =
      session.user.role === "USER"
        ? {
            requestId: id,
            reason: reason.trim(),
            previousStatus: pickupRequest.status,
            hadDriver: !!pickupRequest.driver,
          }
        : {
            requestId: id,
            reason: reason.trim(),
            previousStatus: pickupRequest.status,
            hadDriver: !!pickupRequest.driver,
            cancelledBy: "Admin",
          };

    // Track analytics
    await AnalyticsService.trackEvent({
      eventType: "pickup_cancellation",
      userId: session.user.id,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: "Pickup request cancelled successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Cancel pickup request error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
};
