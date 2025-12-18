import { PAGINATION } from "@/config/constants";
import { AppealStatus, Prisma, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { userAppealSchema } from "@/schemas/authSchemas";
import {
  createTRPCRouter,
  protectedRoleProcedure,
  publicProcedure,
} from "@/trpc/init";
import { z } from "zod";
import { decodeAppealToken } from "../lib/appealToken";
import { TRPCError } from "@trpc/server";

export const appealRouter = createTRPCRouter({
  getAppealedUser: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().default(""),
        page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
      })
    )
    .query(async ({ input }) => {
      const { status, search, page, pageSize } = input;

      const where: Prisma.AppealWhereInput = {};

      if (status && status !== "ALL") {
        where.status = status as AppealStatus;
      }

      const whereCondition = { ...where };

      if (search && search !== "") {
        whereCondition.OR = [
          { email: { contains: search, mode: "insensitive" } }, // filter appeal.email
          {
            user: {
              // filter related user
              name: { contains: search, mode: "insensitive" },
              email: { contains: search, mode: "insensitive" },
            },
          },
        ];
      }

      const [appeals, totalCount] = await Promise.all([
        prisma.appeal.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            ...whereCondition,
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),

        prisma.appeal.count({
          where: {
            ...whereCondition,
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        appeals,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),

  createAppeal: publicProcedure
    .input(
      userAppealSchema.extend({
        appealToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { appealToken, reason, additionalInfo } = input;
      const decoded = decodeAppealToken(appealToken);
      if (!decoded) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired appeal token",
        });
      }

      if (new Date(decoded.expiresAt) < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Expired appeal token",
        });
      }

      // Find the user
      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
        include: { appeal: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if user already has an appeal (one-to-one relation ensures this)
      if (user.appeal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You have already submitted an appeal. Please wait for review.",
        });
      }

      // Create appeal record (will automatically link to user via relation)
      await prisma.appeal.create({
        data: {
          email: decoded.email,
          reason,
          additionalInfo,
          status: "PENDING",
          userId: user.id,
        },
      });

      return { success: true };
    }),

  approveAppeal: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, reviewNotes } = input;

      const adminUser = ctx.auth.user;

      // Find the appeal
      const appeal = await prisma.appeal.findUnique({
        where: { id },
      });

      if (!appeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appeal not found",
        });
      }

      if (!["PENDING", "UNDER_REVIEW"].includes(appeal.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You can only approve pending appeals or appeals under review",
        });
      }

      // Create appeal record (will automatically link to user via relation)
      await prisma.$transaction(async (tx) => {
        return Promise.all([
          tx.appeal.update({
            where: { id },
            data: {
              status: "APPROVED",
              reviewNotes,
              reviewedBy: adminUser.name,
              reviewedAt: new Date(),
            },
          }),
          tx.user.update({
            where: { id: appeal.userId },
            data: {
              status: "APPROVED",
            },
          }),
        ]);
      });

      return { success: true };
    }),

  rejectAppeal: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, reviewNotes } = input;

      const adminUser = ctx.auth.user;

      // Find the appeal
      const appeal = await prisma.appeal.findUnique({
        where: { id },
      });

      if (!appeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appeal not found",
        });
      }

      if (!["PENDING", "UNDER_REVIEW"].includes(appeal.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You can only reject pending appeals or appeals under review",
        });
      }

      // Create appeal record (will automatically link to user via relation)
      await prisma.appeal.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewNotes,
          reviewedBy: adminUser.name,
          reviewedAt: new Date(),
        },
      });

      return { success: true };
    }),

  reviewAppeal: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        id: z.string(),
        reviewNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, reviewNotes } = input;

      const adminUser = ctx.auth.user;

      // Find the appeal
      const appeal = await prisma.appeal.findUnique({
        where: { id },
      });

      if (!appeal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Appeal not found",
        });
      }

      if (!["PENDING"].includes(appeal.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only change pending appeals status",
        });
      }

      // Create appeal record (will automatically link to user via relation)
      await prisma.appeal.update({
        where: { id },
        data: {
          status: "UNDER_REVIEW",
          reviewNotes,
          reviewedBy: adminUser.name,
          reviewedAt: new Date(),
        },
      });

      return { success: true };
    }),

  // Decode appeal token server-side
  decodeAppealToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const decoded = decodeAppealToken(input.token);

      if (!decoded) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired appeal token",
        });
      }

      // Verify the user exists
      const user = await prisma.user.findUnique({
        where: { email: decoded.email },
        select: {
          email: true,
          name: true,
          status: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        email: decoded.email,
        userName: user.name,
        expiresAt: decoded.expiresAt,
      };
    }),
});
