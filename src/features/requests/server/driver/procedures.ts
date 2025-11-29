import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";

import { prisma } from "@/lib/db";

import { createTRPCRouter, protectedRoleProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { NotificationService } from "@/lib/notifications";
import { AnalyticsService } from "@/lib/analytics";

export const driverRequestsRouter = createTRPCRouter({
  getRequestStats: protectedRoleProcedure(UserRole.TRANSPORTATION_TEAM).query(
    async ({ ctx }) => {
      const userId = ctx.auth.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get statistics for the transportation team member
      const [
        myActiveRequests,
        availableRequests,
        completedToday,
        totalCompleted,
      ] = await Promise.all([
        // My accepted requests that are not completed
        prisma.pickupRequest.count({
          where: {
            driverId: userId,
            status: "ACCEPTED",
          },
        }),

        // Available requests (pending and within reasonable distance - all pending for now)
        prisma.pickupRequest.count({
          where: {
            status: "PENDING",
          },
        }),

        // Completed requests by me today
        prisma.pickupRequest.count({
          where: {
            driverId: userId,
            status: "COMPLETED",
            updatedAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),

        // Total completed requests by me
        prisma.pickupRequest.count({
          where: {
            driverId: userId,
            status: "COMPLETED",
          },
        }),
      ]);

      return {
        myActiveRequests,
        availableRequests,
        completedToday,
        totalCompleted,
      };
    }
  ),

  driverCancelRequest: protectedRoleProcedure(UserRole.TRANSPORTATION_TEAM)
    .input(
      z.object({
        id: z.string(),
        driverId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, driverId, reason } = input;

      if (!reason || reason.trim().length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cancellation reason is required",
        });
      }

      if (driverId !== ctx.auth.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized",
        });
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
        userId: ctx.auth.user.id,
        metadata: {
          requestId: id,
          reason: reason.trim(),
          previousStatus: pickupRequest.status,
          updatedStatus: updatedRequest.status,
          hadDriver: !!pickupRequest.driver,
        },
      });

      return {
        success: true,
        message: "Pickup cancelled successfully",
        request: updatedRequest,
      };
    }),
});
