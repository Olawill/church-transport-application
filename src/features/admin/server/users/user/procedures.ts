import { z } from "zod";

import { Prisma, UserRole } from "@/generated/prisma/client";

import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";

import { createTRPCRouter, protectedRoleProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { generateAppealToken } from "@/features/appeal/lib/appealToken";

export const adminUserRouter = createTRPCRouter({
  updateUserRole: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
        role: z.enum(UserRole),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, role } = input;

      // Check if user already exist
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (["REJECTED", "PENDING", "BANNED"].includes(existingUser.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only approved users' role can be changed",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          role,
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        eventType: "user_role_update",
        userId: id,
        metadata: {
          updatedBy: ctx.auth.user.id,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    }),

  getUserAddresses: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { id } = input;

      // Check if user exist
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const addresses = await prisma.address.findMany({
        where: {
          userId: id,
          isActive: true,
        },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });

      return addresses;
    }),

  approveUser: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Check if user already exist
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (!["REJECTED", "PENDING"].includes(existingUser.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending or rejected users can be approved",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          status: "APPROVED",
          isActive: true,
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        eventType: "user_approval",
        userId: id,
        metadata: { approvedBy: ctx.auth.user.id },
      });

      return {
        success: true,
        user: updatedUser,
      };
    }),

  rejectUser: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Check if user already exist
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (existingUser.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending users can be rejected",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          status: "REJECTED",
          isActive: false,
        },
      });

      // Generate Appeal Token
      const appealToken = generateAppealToken(existingUser.email);

      // Track analytics
      await AnalyticsService.trackEvent({
        eventType: "user_rejected",
        userId: id,
        metadata: { rejectedBy: ctx.auth.user.id },
      });

      return {
        success: true,
        user: updatedUser,
        appealToken,
      };
    }),

  banUser: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
        reason: z.string(),
        banExpires: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, reason, banExpires } = input;

      if (!reason || reason.trim().length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ban reason is required",
        });
      }

      // Check if user already exist
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (existingUser.role === UserRole.ADMIN) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot ban admin users",
        });
      }

      if (existingUser.status === "BANNED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already banned",
        });
      }

      const updatedData: Prisma.UserUpdateInput = {
        status: "BANNED",
        isActive: false,
        banned: true,
        bannedAt: new Date(),
        bannedBy: ctx.auth.user.id,
        banReason: reason.trim(),
      };

      if (banExpires) {
        updatedData.banExpires = banExpires;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updatedData,
      });

      // Cancel any pending pickup requests
      await prisma.pickupRequest.updateMany({
        where: {
          userId: id,
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        eventType: "user_ban",
        userId: id,
        metadata: {
          bannedBy: ctx.auth.user.id,
          reason: reason.trim(),
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    }),

  unBanUser: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Check if user already exist
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (existingUser.status !== "BANNED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only banned users can be unbanned",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          status: "APPROVED",
          isActive: true,
          bannedAt: null,
          bannedBy: null,
          banReason: null,
          banned: false,
          banExpires: null,
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        eventType: "user_unban",
        userId: id,
        metadata: { unbannedBy: ctx.auth.user.id },
      });

      return {
        success: true,
        user: updatedUser,
      };
    }),
});
