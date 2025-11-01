import { Frequency, Ordinal, UserRole, UserStatus } from "@/generated/prisma";
import { z } from "zod";

import { prisma } from "@/lib/db";

import { PAGINATION } from "@/config/constants";
import { serviceDaySchema } from "@/schemas/serviceDaySchema";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedRoleProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";

const updateServiceSchema = z.object({
  id: z.string(),
  service: serviceDaySchema,
});

export const usersRouter = createTRPCRouter({
  getUsers: protectedProcedure
    .input(
      z.object({
        role: z.enum(UserRole).optional(),
        status: z.enum(UserStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { role, status } = input;

      const where: Record<string, string> = {};

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }
      const users = await prisma.user.findMany({
        where: {
          ...where,
          id: {
            not: {
              equals: ctx.auth.user.id,
            },
          },
        },
        include: {
          addresses: {
            where: { isDefault: true },
          },
          _count: {
            select: {
              pickupRequests: true,
              acceptedRequests: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return users;
    }),

  getPaginatedUsers: protectedRoleProcedure(UserRole.ADMIN)
    .input(
      z.object({
        role: z.string().optional(),
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
    .query(async ({ ctx, input }) => {
      const { role, status, search, page, pageSize } = input;

      const where: Record<string, string | Record<string, string>> = {};

      if (role && role !== "ALL") {
        where.role = role;
      }

      if (status && status !== "ALL") {
        where.status = status;
      }

      const whereCondition = { ...where };

      if (search && search !== "") {
        whereCondition.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            ...whereCondition,
            id: {
              not: {
                equals: ctx.auth.user.id,
              },
            },
          },
          include: {
            addresses: {
              where: { isDefault: true },
            },
            _count: {
              select: {
                pickupRequests: true,
                acceptedRequests: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),

        prisma.user.count({
          where: {
            ...whereCondition,
            id: {
              not: {
                equals: ctx.auth.user.id,
              },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        users,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),

  createService: protectedRoleProcedure(UserRole.ADMIN)
    .input(serviceDaySchema)
    .mutation(async ({ input }) => {
      const {
        name,
        time,
        isActive = true,
        serviceCategory,
        serviceType,
        startDate,
        dayOfWeek: inputDayOfWeek,
      } = input;

      // Extract dayOfWeek from the validated data
      const dayOfWeek = Array.isArray(inputDayOfWeek)
        ? inputDayOfWeek.map((d) => parseInt(d, 10))
        : [parseInt(inputDayOfWeek, 10)];

      const validatedStartDate = startDate ? new Date(startDate) : undefined;
      const validatedEndDate =
        "endDate" in input && input.endDate
          ? new Date(input.endDate)
          : undefined;

      // Create service day with weekdays
      const serviceDay = await prisma.serviceDay.create({
        data: {
          name,
          time,
          serviceType,
          serviceCategory,
          isActive: isActive ?? true,
          startDate: validatedStartDate?.toISOString() || null,
          endDate: validatedEndDate?.toISOString() || null,
          frequency: "frequency" in input ? input.frequency : Frequency.NONE,
          ordinal: "ordinal" in input ? input.ordinal : Ordinal.NEXT,
          cycle: "cycle" in input ? input.cycle : null,
          weekdays: {
            create: dayOfWeek.map((day: number) => ({
              dayOfWeek: day,
            })),
          },
        },
        include: {
          weekdays: true,
        },
      });

      return serviceDay;
    }),

  updateService: protectedRoleProcedure(UserRole.ADMIN)
    .input(updateServiceSchema)
    .mutation(async ({ input }) => {
      const { id, service } = input;
      const {
        name,
        time,
        isActive = true,
        serviceCategory,
        serviceType,
        startDate,
        dayOfWeek: inputDayOfWeek,
      } = service;

      // Extract dayOfWeek from the validated data
      const dayOfWeek = Array.isArray(inputDayOfWeek)
        ? inputDayOfWeek.map((d) => parseInt(d, 10))
        : [parseInt(inputDayOfWeek, 10)];

      const validatedStartDate = startDate ? new Date(startDate) : undefined;
      const validatedEndDate =
        "endDate" in service && service.endDate
          ? new Date(service.endDate)
          : undefined;

      // Update service day
      const serviceDay = await prisma.$transaction(async (tx) => {
        // Get existing weekdays
        const existingWeekdays = await tx.serviceDayWeekday.findMany({
          where: { serviceDayId: id },
          select: { dayOfWeek: true },
        });

        const existingDays = existingWeekdays.map((w) => w.dayOfWeek);

        // Delete weekdays that are no longer selected
        const daysToDelete = existingDays.filter(
          (day) => !dayOfWeek.includes(day)
        );

        if (daysToDelete.length > 0) {
          await tx.serviceDayWeekday.deleteMany({
            where: {
              serviceDayId: id,
              dayOfWeek: { in: daysToDelete },
            },
          });
        }

        // Create only new weekdays that don't exist
        const daysToCreate = dayOfWeek.filter(
          (day) => !existingDays.includes(day)
        );
        if (daysToCreate.length > 0) {
          await tx.serviceDayWeekday.createMany({
            data: daysToCreate.map((day) => ({
              serviceDayId: id,
              dayOfWeek: day,
            })),
          });
        }

        // Update the service day
        return await tx.serviceDay.update({
          where: { id },
          // data: updateData,
          data: {
            name,
            time,
            serviceType,
            serviceCategory,
            isActive: isActive ?? true,
            startDate: validatedStartDate?.toISOString() || null,
            endDate: validatedEndDate || null,
            frequency:
              "frequency" in service ? service.frequency : Frequency.NONE,
            ordinal: "ordinal" in service ? service.ordinal : Ordinal.NEXT,
            cycle: "cycle" in service ? service.cycle : null,
          },
          include: {
            weekdays: true,
          },
        });
      });

      return serviceDay;
    }),

  deleteService: protectedRoleProcedure(UserRole.ADMIN)
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { id } = input;

      const deletedService = await prisma.$transaction(async (tx) => {
        const existingService = await tx.serviceDay.findUnique({
          where: { id },
        });

        if (!existingService) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Service day not found",
          });
        }

        return tx.serviceDay.delete({ where: { id } });
      });

      return {
        message: "Service day deleted",
        deletedService,
      };
    }),

  toggleServiceActive: protectedRoleProcedure(UserRole.ADMIN)
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { id } = input;

      const updatedService = await prisma.$transaction(async (tx) => {
        const existingService = await tx.serviceDay.findUnique({
          where: { id },
          select: { isActive: true, updatedAt: true },
        });

        if (!existingService) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Service day not found",
          });
        }

        // Restrict restoring to 24 hours
        if (!existingService.isActive) {
          const now = new Date();
          const lastUpdated = new Date(existingService.updatedAt);
          const hoursSinceUpdate =
            (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

          if (hoursSinceUpdate < 24) {
            const hoursRemaining = Math.ceil(24 - hoursSinceUpdate);
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Service can only be restored after 24 hours. Please wait ${hoursRemaining} more hour${hoursRemaining > 1 ? "s" : ""}.`,
            });
          }
        }

        // Toggle isActive status
        return tx.serviceDay.update({
          where: { id },
          data: { isActive: !existingService.isActive },
          include: { weekdays: true },
        });
      });

      return {
        message: `Service day ${
          updatedService.isActive ? "restored" : "deactivated"
        }`,
        updatedService,
      };
    }),
});
