import {
  PickupRequest,
  Prisma,
  PrismaClient,
  RequestStatus,
  UserRole,
} from "@/generated/prisma/client";
import { z } from "zod";

import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import {
  convertStringDateToDate,
  TRANSACTION_CONFIG,
  validateDayOfWeek,
  validateEndDateLimit,
  validatePickUpRequestTiming,
} from "@/lib/pickup-utils";
import { calculateDistance, getNextOccurrencesOfWeekdays } from "@/lib/utils";
import { userPayloadSchema } from "@/schemas/newRequestSchema";

import { PAGINATION } from "@/config/constants";
import {
  createTRPCRouter,
  protectedProcedure,
  protectedRoleProcedure,
} from "@/trpc/init";
import { TRPCError } from "@trpc/server";

type DuplicationType = {
  serviceDayId: string;
  requestDate: Date;
  userId: string;
  excludeRequestId?: string;
};

const validateRequestDuplicate = async (
  { serviceDayId, requestDate, userId, excludeRequestId }: DuplicationType,
  db: Prisma.TransactionClient | PrismaClient = prisma
) => {
  const similarRequest = await db.pickupRequest.findFirst({
    where: {
      serviceDayId,
      userId,
      requestDate,
      ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
    },
  });

  return !!similarRequest;
};

export const userRequestRouter = createTRPCRouter({
  getUserRequests: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        serviceDay: z.string().optional(),
        type: z.string().optional(),
        requestDate: z.string().optional(),
        maxDistance: z.string().optional(),
        page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        status,
        type,
        requestDate,
        maxDistance,
        page,
        pageSize,
        search,
        serviceDay,
      } = input;

      const where: Prisma.PickupRequestWhereInput = {};
      const baseWhere: Prisma.PickupRequestWhereInput = {};

      const filter = () => {
        if (status && status !== "ALL") {
          where.status = { equals: status as RequestStatus };
        }

        if (type === "PICKUP") {
          where.isPickUp = true;
        } else if (type === "DROPOFF") {
          where.isDropOff = true;
        }

        if (requestDate && requestDate !== "") {
          const date = new Date(requestDate);
          if (!isNaN(date.getTime())) {
            const endOfDay = new Date(date);
            endOfDay.setUTCHours(23, 59, 59, 999);
            where.requestDate = {
              gte: date,
              lte: endOfDay,
            };
          }
        }

        if (search && search !== "") {
          where.user = {
            name: {
              contains: search,
              mode: "insensitive",
            },
          };
        }

        if (serviceDay && serviceDay !== "ALL") {
          where.serviceDay = {
            name: {
              equals: serviceDay,
              mode: "insensitive",
            },
          };
        }
      };

      // Filter based on user role
      if (ctx.auth.user.role === UserRole.USER) {
        where.userId = ctx.auth.user.id;
        baseWhere.userId = ctx.auth.user.id;
        filter();
      } else if (ctx.auth.user.role === UserRole.TRANSPORTATION_TEAM) {
        // For drivers, show requests within their preferred distance
        filter();
      } else if (ctx.auth.user.role === UserRole.ADMIN) {
        filter();
      }

      const [requests, totalCount, allRequests] = await Promise.all([
        prisma.pickupRequest.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where,
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
            serviceWeekday: true,
          },
          orderBy: { createdAt: "desc" },
        }),

        prisma.pickupRequest.count({
          where,
        }),
        prisma.pickupRequest.findMany({
          where: baseWhere,
          select: {
            status: true,
            isPickUp: true,
            isDropOff: true,
            driverId: true,
          },
        }),
      ]);

      // Calculate stats from all requests (not filtered)
      const totalPending = allRequests.filter(
        (r) => r.status === "PENDING"
      ).length;
      const totalAccepted = allRequests.filter(
        (r) => r.status === "ACCEPTED"
      ).length;
      const totalCompleted = allRequests.filter(
        (r) => r.status === "COMPLETED"
      ).length;
      const totalPickUp = allRequests.filter((r) => r.isPickUp === true).length;
      const totalDropOff = allRequests.filter(
        (r) => r.isDropOff === true
      ).length;

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      // For transportation team members, filter by distance if coordinates are available
      if (ctx.auth.user.role === UserRole.TRANSPORTATION_TEAM && maxDistance) {
        const driver = await prisma.user.findUniqueOrThrow({
          where: { id: ctx.auth.user.id },
          include: {
            addresses: {
              where: { isDefault: true },
            },
          },
        });

        const driverAddress = driver?.addresses?.[0];
        const maxDistanceKm = parseInt(maxDistance);

        if (driverAddress?.latitude && driverAddress?.longitude) {
          const filteredRequests = requests.filter((request) => {
            if (!request.address.latitude || !request.address.longitude) {
              return true; // Include requests without coordinates
            }

            const distance = calculateDistance(
              driverAddress.latitude!,
              driverAddress.longitude!,
              request.address.latitude,
              request.address.longitude
            );

            return distance <= maxDistanceKm;
          });

          const totalFilteredCount = filteredRequests.length;
          const totalFilteredPages = Math.ceil(totalFilteredCount / pageSize);
          const hasNextPageFiltered = page < totalFilteredPages;
          const hasPreviousPageFiltered = page > 1;

          const myAcceptedRequests = allRequests.filter(
            (r) => r.status === "ACCEPTED" && r.driverId === ctx.auth.user.id
          ).length;
          const totalCompletedRequests = allRequests.filter(
            (r) => r.status === "COMPLETED" && r.driverId === ctx.auth.user.id
          ).length;

          return {
            requests: filteredRequests,
            page,
            pageSize,
            totalCount: totalFilteredCount,
            totalPages: totalFilteredPages,
            hasNextPage: hasNextPageFiltered,
            hasPreviousPage: hasPreviousPageFiltered,
            stats: {
              myAcceptedRequests,
              availableRequests: totalPending,
              totalCompletedRequests,
            },
          };
        }
      }
      return {
        requests,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        stats: {
          totalPending,
          totalAccepted,
          totalCompleted,
          totalPickUp,
          totalDropOff,
          totalAll: allRequests.length,
        },
      };
    }),

  createUserRequest: protectedRoleProcedure([
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.USER,
  ])
    .input(userPayloadSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        userId,
        serviceDayId,
        addressId,
        requestDate,
        serviceDayOfWeek,
        isPickUp,
        isDropOff,
        isGroupRide,
        numberOfGroup,
        isRecurring,
        endDate,
        notes,
      } = input;

      const isAdmin = ctx.auth.user.role === UserRole.ADMIN;
      const targetUserId = isAdmin ? userId : ctx.auth.user.id;

      if (isAdmin && !userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is required when creating on behalf of a user",
        });
      }

      // Optimization: Parallel validation queries instead of sequential
      const parts = (serviceDayOfWeek ?? "").split("-");

      if (parts.length < 2 || isNaN(Number(parts[0]))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid service day of week",
        });
      }

      const dayOfWeek = Number(parts[0]);

      const [serviceDay, address, existingRequest, existingUser] =
        await Promise.all([
          prisma.serviceDay.findUnique({
            where: { id: serviceDayId },
            include: {
              weekdays: {
                where: { dayOfWeek },
              },
            },
          }),
          prisma.address.findFirst({
            where: {
              id: addressId,
              userId: targetUserId,
            },
          }),
          prisma.pickupRequest.findFirst({
            where: {
              userId: targetUserId,
              serviceDayId,
              requestDate,
            },
          }),

          // Only fetch user if admin is creating on behalf of another user
          isAdmin && userId
            ? prisma.user.findUnique({ where: { id: userId } })
            : Promise.resolve(true),
        ]);

      // Validate all at once
      if (isAdmin && !existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User not found",
        });
      }

      if (!serviceDay) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      if (existingRequest) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a pickup request for this service",
        });
      }
      // Convert requestDate
      const normalizedRequestDate = convertStringDateToDate(requestDate);
      // Convert endDate
      const normalizedEndDate = endDate
        ? convertStringDateToDate(endDate)
        : undefined;

      // Check if it's too late to request pickup (less than 1 hour before service)
      const timingValidation = validatePickUpRequestTiming(
        serviceDay,
        normalizedRequestDate
      );
      if (!timingValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: timingValidation.error,
        });
      }

      // Validate requestDate has the same day of week
      const dayValidation = validateDayOfWeek(dayOfWeek, normalizedRequestDate);
      if (!dayValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: dayValidation.error,
        });
      }

      // Validate endDate limit
      const endDateValidation = validateEndDateLimit(
        normalizedEndDate,
        normalizedRequestDate,
        isRecurring
      );
      if (!endDateValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: endDateValidation.error,
        });
      }

      let allRequests: PickupRequest[] = [];
      let seriesId: string | null = null;

      if (serviceDay.weekdays.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Service does not have any service days",
        });
      }

      const serviceWeekdayId = serviceDay.weekdays[0].id;

      if (!isRecurring) {
        const pickupRequest = await prisma.pickupRequest.create({
          data: {
            userId: targetUserId as string,
            serviceDayId,
            addressId,
            requestDate: normalizedRequestDate,
            serviceWeekdayId,
            isPickUp,
            isDropOff,
            notes,
            status: "PENDING",
            isGroupRide,
            numberOfGroup,
          },
          include: {
            serviceDay: true,
            address: true,
          },
        });
        allRequests.push(pickupRequest);
      } else {
        // Get all request dates
        const allRequestDates = getNextOccurrencesOfWeekdays({
          fromDate: normalizedRequestDate,
          allowedWeekdays: [dayOfWeek],
          count: 1,
          endDate: normalizedEndDate,
        });

        // use Transaction to create many request
        const { series, requests } = await prisma.$transaction(async (tx) => {
          // 1️⃣ Create the series first
          const series = await tx.pickupSeries.create({
            data: {},
          });

          // 2️⃣ Create all related pickup requests referencing the same seriesId
          const requests = await Promise.all(
            allRequestDates.map((d) =>
              tx.pickupRequest.create({
                data: {
                  userId: targetUserId as string,
                  serviceDayId,
                  addressId,
                  requestDate: d,
                  serviceWeekdayId,
                  isPickUp,
                  isDropOff,
                  notes,
                  status: "PENDING",
                  isGroupRide,
                  numberOfGroup,
                  seriesId: series.id, // link to the series
                },
                include: {
                  serviceDay: true,
                  address: true,
                },
              })
            )
          );

          return { series, requests };
        }, TRANSACTION_CONFIG);
        allRequests = requests;
        seriesId = series.id;
      }

      // OPTIMIZATION: Batch analytics tracking (fire and forget)
      // Track pickup request creation
      const trackingPromise = isAdmin
        ? AnalyticsService.trackEvent({
            eventType: isRecurring
              ? "admin_user_recurring_pickup_request_created"
              : "admin_user_pickup_request_created",
            userId,
            metadata: {
              adminId: ctx.auth.user.id,
              ...(isRecurring
                ? { seriesId }
                : { requestId: allRequests[0].id }),
              serviceDayId,
              dayOfWeek,
              addressId,
            },
          })
        : isRecurring
          ? AnalyticsService.trackEvent({
              eventType: "recurring_pickup_request_created",
              userId: ctx.auth.user.id,
              metadata: { seriesId, serviceDayId, dayOfWeek, addressId },
            })
          : AnalyticsService.trackPickupRequest(
              ctx.auth.user.id,
              allRequests[0].id,
              serviceDayId,
              addressId,
              dayOfWeek
            );

      // Don't await analytics - let it complete in background
      trackingPromise.catch((err) =>
        console.error("Analytics tracking failed:", err)
      );

      return allRequests;
    }),

  updateUserRequest: protectedRoleProcedure([
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.USER,
  ])
    .input(userPayloadSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        requestId,
        userId,
        serviceDayId,
        serviceDayOfWeek,
        addressId,
        requestDate,
        isDropOff,
        isPickUp,
        isGroupRide,
        numberOfGroup,
        notes,
        updateSeries,
      } = input;
      const isAdmin = ctx.auth.user.role === UserRole.ADMIN;
      const targetUserId = isAdmin ? userId : ctx.auth.user.id;

      if (isAdmin && !userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is required when creating on behalf of a user",
        });
      }

      // Optimization: Parallel validation queries instead of sequential
      const parts = (serviceDayOfWeek ?? "").split("-");

      if (!serviceDayOfWeek) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid service day of week",
        });
      }

      const dayOfWeek = Number(parts[0]);

      const [existingRequest, serviceDay, address, existingUser] =
        await Promise.all([
          prisma.pickupRequest.findUnique({ where: { id: requestId } }),
          prisma.serviceDay.findUnique({
            where: { id: serviceDayId },
            include: {
              weekdays: {
                where: { dayOfWeek },
              },
            },
          }),
          prisma.address.findFirst({
            where: { id: addressId, userId: targetUserId },
          }),
          isAdmin && userId
            ? prisma.user.findUnique({ where: { id: userId } })
            : Promise.resolve(true),
        ]);

      // Validate all at once
      if (isAdmin && !existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User not found",
        });
      }

      if (!existingRequest) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The Pickup Request does not exist",
        });
      }

      // Enforce ownership for regular users
      if (
        ctx.auth.user.role === UserRole.USER &&
        existingRequest.userId !== ctx.auth.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      }

      if (!serviceDay) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid service day",
        });
      }

      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }
      // Convert requestDate
      const normalizedRequestDate = convertStringDateToDate(requestDate);

      // Check if it's too late to request pickup (less than 1 hour before service)
      const timingValidation = validatePickUpRequestTiming(
        serviceDay,
        normalizedRequestDate
      );
      console.log({ timingValidation });
      if (!timingValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: timingValidation.error,
        });
      }

      // Validate requestDate has the same day of week
      const dayValidation = validateDayOfWeek(dayOfWeek, normalizedRequestDate);
      console.log({ dayValidation });
      if (!dayValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: dayValidation.error,
        });
      }

      let allUpdatedRequest: PickupRequest[] = [];

      if (!updateSeries) {
        const isSameRequest = await validateRequestDuplicate({
          serviceDayId,
          userId: targetUserId as string,
          requestDate: normalizedRequestDate,
          excludeRequestId: requestId!,
        });

        if (isSameRequest) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "You already have a pickup request for this service occurrence",
          });
        }
        const pickupRequest = await prisma.pickupRequest.update({
          where: {
            id: requestId,
          },
          data: {
            serviceDayId,
            addressId,
            requestDate: normalizedRequestDate,
            isDropOff,
            isPickUp,
            notes: notes || null,
            isGroupRide,
            numberOfGroup,
          },
          include: {
            serviceDay: true,
            address: true,
          },
        });
        allUpdatedRequest.push(pickupRequest);
      } else {
        // 🔁 Update all requests in the same series
        if (!existingRequest.seriesId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This request is not part of a series",
          });
        }

        const seriesId = existingRequest.seriesId;

        // get existingRequestDate, existingServiceDayId and seriesId
        const isSameRequestDate =
          existingRequest.requestDate.toISOString().split("T")[0] ===
            normalizedRequestDate.toISOString().split("T")[0] &&
          existingRequest.serviceDayId === serviceDayId;

        // Use transaction
        if (isSameRequestDate) {
          allUpdatedRequest = await prisma.$transaction(async (tx) => {
            await tx.pickupRequest.updateMany({
              where: {
                seriesId,
                requestDate: {
                  gte: normalizedRequestDate,
                },
              },
              data: {
                addressId,
                isDropOff,
                isPickUp,
                notes: notes || null,
                isGroupRide,
                numberOfGroup,
              },
            });

            // Fetch updated records within the same transaction
            return await tx.pickupRequest.findMany({
              where: {
                seriesId,
                requestDate: { gte: normalizedRequestDate },
              },
              include: { serviceDay: true, address: true },
              orderBy: { requestDate: "asc" },
            });
          }, TRANSACTION_CONFIG);
        } else {
          // OPTIMIZATION: Use a single transaction for complex series updates
          allUpdatedRequest = await prisma.$transaction(async (tx) => {
            const [requestsToUpdate, totalCount] = await Promise.all([
              tx.pickupRequest.findMany({
                where: {
                  seriesId,
                  requestDate: { gte: existingRequest.requestDate },
                },
                orderBy: { requestDate: "asc" },
                select: { id: true },
              }),
              tx.pickupRequest.count({
                where: {
                  seriesId,
                  requestDate: { gte: existingRequest.requestDate },
                },
              }),
            ]);

            // Get all dates
            const allDates = getNextOccurrencesOfWeekdays({
              fromDate: normalizedRequestDate,
              allowedWeekdays: [dayOfWeek],
              count: totalCount,
            });

            if (allDates.length !== requestsToUpdate.length) {
              throw new Error("Error updating service date for the series");
            }

            const duplicates = await Promise.all(
              requestsToUpdate.map((_, index) => {
                return validateRequestDuplicate(
                  {
                    serviceDayId,
                    userId: targetUserId as string,
                    requestDate: allDates[index],
                  },
                  tx
                );
              })
            );

            // Check if all are non-duplicates (false)
            const hasDuplicate = duplicates.some((b) => b);

            if (hasDuplicate) {
              throw new Error("DUPLICATE_REQUEST");
            }

            // Batch update using Promise.all within the transaction
            return await Promise.all(
              requestsToUpdate.map(({ id }, index) =>
                tx.pickupRequest.update({
                  where: { id },
                  data: {
                    serviceDayId,
                    requestDate: allDates[index],
                    addressId,
                    isDropOff,
                    isPickUp,
                    notes: notes || null,
                    isGroupRide,
                    numberOfGroup,
                  },
                  include: { serviceDay: true, address: true },
                })
              )
            );
          }, TRANSACTION_CONFIG);
        }
      }

      // Track pickup request creation
      const trackingPromise = isAdmin
        ? AnalyticsService.trackEvent({
            eventType: updateSeries
              ? "admin_user_recurring_pickup_request_updated"
              : "admin_user_pickup_request_updated",
            userId,
            metadata: {
              adminId: ctx.auth.user.id,
              ...(updateSeries
                ? { seriesId: existingRequest.seriesId }
                : { requestId: allUpdatedRequest[0].id }),
              serviceDayId,
              dayOfWeek,
              addressId,
            },
          })
        : updateSeries
          ? AnalyticsService.trackEvent({
              eventType: "recurring_pickup_request_updated",
              userId: ctx.auth.user.id,
              metadata: {
                seriesId: existingRequest.seriesId,
                serviceDayId,
                dayOfWeek,
                addressId,
              },
            })
          : AnalyticsService.trackEvent({
              eventType: "pickup_request_updated",
              userId: ctx.auth.user.id,
              metadata: {
                requestId: allUpdatedRequest[0].id,
                serviceDayId,
                dayOfWeek,
                addressId,
              },
            });

      // Don't await analytics - let it complete in background
      trackingPromise.catch((err) =>
        console.error("Analytics tracking failed:", err)
      );

      return allUpdatedRequest;
    }),

  updateRequestStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(RequestStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;

      let requestDriverId: string = "";

      if (!id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request ID is required",
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

      // Users can only update their own requests
      if (
        ctx.auth.user.role === UserRole.USER &&
        existingRequest.userId !== ctx.auth.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
      }

      // Transportation team can accept/deny requests
      if (
        ctx.auth.user.role === UserRole.TRANSPORTATION_TEAM &&
        status === "ACCEPTED"
      ) {
        requestDriverId = ctx.auth.user.id;
      }

      let distance = null;
      const driverId = requestDriverId || existingRequest.driverId;

      if (!driverId) {
        // Handle missing driver (skip query or throw an error)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Driver ID is required to fetch address",
        });
      }

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
          status: status || existingRequest.status,
          driverId: requestDriverId || existingRequest.driverId,
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
      if (
        status === "ACCEPTED" &&
        ctx.auth.user.role === UserRole.TRANSPORTATION_TEAM
      ) {
        await AnalyticsService.trackDriverAcceptance(
          ctx.auth.user.id,
          id,
          existingRequest.userId
        );
      } else if (
        status === "COMPLETED" &&
        ctx.auth.user.role === UserRole.TRANSPORTATION_TEAM
      ) {
        await AnalyticsService.trackPickupCompletion(
          ctx.auth.user.id,
          id,
          existingRequest.userId
        );
      }

      return { status, updatedRequest };
    }),
});
