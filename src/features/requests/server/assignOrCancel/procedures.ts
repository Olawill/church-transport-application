import { RequestStatus, UserRole } from "@/generated/prisma";
import { z } from "zod";

import { prisma } from "@/lib/db";

import { AnalyticsService } from "@/lib/analytics";
import { NotificationService } from "@/lib/notifications";
import { calculateDistance } from "@/lib/utils";
import { createTRPCRouter, protectedRoleProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const requestsRouter = createTRPCRouter({
  adminAssign: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
        driverId: z.string(),
        status: z.enum(RequestStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, driverId } = input;

      if (!id || !driverId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request ID or Driver ID is required",
        });
      }

      // Check permissions
      const existingRequest = await prisma.pickupRequest.findUnique({
        where: { id },
      });

      if (!existingRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
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
          assignedBy: ctx.auth.user.id,
          timestamp: new Date().toISOString(),
        },
      });

      return updatedRequest;
    }),

  cancelRequest: protectedRoleProcedure([
    UserRole.USER,
    UserRole.ADMIN,
    UserRole.OWNER,
  ])
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, reason } = input;

      if (!reason || reason.trim().length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cancellation reason is required",
        });
      }
      const where =
        ctx.auth.user.role === "ADMIN"
          ? { id }
          : { id, userId: ctx.auth.user.id };

      const pickupRequest = await prisma.pickupRequest.findFirst({
        where,
        include: {
          driver: true,
          serviceDay: true,
        },
      });

      if (!pickupRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pickup request not found or not authorized",
        });
      }

      // Check if request can be cancelled
      if (pickupRequest.status === "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel completed requests",
        });
      }

      if (pickupRequest.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request is already cancelled",
        });
      }

      // Check if it's too late to cancel (less than 2 hours before service)
      const serviceDateTime = new Date(pickupRequest.requestDate);
      const serviceDay = await prisma.serviceDay.findUnique({
        where: { id: pickupRequest.serviceDay.id },
      });
      if (!serviceDay) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid service day",
        });
      }
      const [hh, mm] = serviceDay.time.split(":").map((n) => parseInt(n, 10));
      const serviceStart = new Date(serviceDateTime);
      serviceStart.setHours(hh || 0, mm || 0, 0, 0);
      const cutoff = new Date(serviceStart.getTime() - 2 * 60 * 60 * 1000);

      if (
        pickupRequest.status === "ACCEPTED" &&
        Date.now() > cutoff.getTime()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot cancel accepted requests less than 2 hours before service time",
        });
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
        const text = `Hello ${pickupRequest.driver.name}! The pickup request you accepted for ${pickupRequest.serviceDay?.name} has been cancelled by the ${ctx.auth.user.role === "USER" ? "user" : "admin"}. Reason: ${reason.trim()}`;
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
        ctx.auth.user.role === "USER"
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
        userId: ctx.auth.user.id,
        metadata,
      });

      return {
        success: true,
        message: "Pickup request cancelled successfully",
        request: updatedRequest,
      };
    }),
});
