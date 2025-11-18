import { PickupRequest, UserRole } from "@/generated/prisma";

import { AnalyticsService } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocoding";
import {
  convertStringDateToDate,
  TRANSACTION_CONFIG,
  validateDayOfWeek,
  validateEndDateLimit,
  validatePickUpRequestTiming,
} from "@/lib/pickup-utils";
import { getNextOccurrencesOfWeekdays } from "@/lib/utils";
import { adminPayloadSchema } from "@/schemas/newRequestSchema";

import { createTRPCRouter, protectedRoleProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

const validatePassword = (isLoginRequired: boolean, password?: string) => {
  if (isLoginRequired && (!password || password.length < 8)) {
    return {
      valid: false,
      error: "Password is required and must be at least 8 characters",
    };
  }
  return { valid: true };
};

export const adminUserRequestRouter = createTRPCRouter({
  createUserRequest: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(adminPayloadSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        firstName,
        lastName,
        email,
        phone,
        isLoginRequired,
        password,
        street,
        city,
        province,
        postalCode,
        country,
        serviceDayId,
        serviceDayOfWeek,
        requestDate,
        notes,
        isPickUp,
        isDropOff,
        isGroupRide,
        numberOfGroup,
        isRecurring,
        endDate,
      } = input;

      // Early validation
      const passwordValidation = validatePassword(isLoginRequired, password);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: passwordValidation.error,
        });
      }

      // Convert requestDate
      const normalizedRequestDate = convertStringDateToDate(requestDate);
      // Convert endDate
      const normalizedEndDate = endDate
        ? convertStringDateToDate(endDate)
        : undefined;

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

      // OPTIMIZATION 3: Parallel validation queries (user + serviceDay)
      const parts = serviceDayOfWeek.split("-");

      if (parts.length < 2 || isNaN(Number(parts[0]))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid service day of week",
        });
      }

      const dayOfWeek = Number(parts[0]);

      const [existingUser, serviceDay] = await Promise.all([
        prisma.user.findUnique({
          where: { email },
          select: { id: true }, // Only fetch what we need
        }),
        prisma.serviceDay.findUnique({
          where: { id: serviceDayId },
          include: { weekdays: { where: { dayOfWeek } } },
        }),
      ]);

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User with this email already exists",
        });
      }

      if (!serviceDay) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid service day",
        });
      }

      if (serviceDay.weekdays.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Service day does not support the requested day of week",
        });
      }

      const dayValidation = validateDayOfWeek(dayOfWeek, normalizedRequestDate);
      if (!dayValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: dayValidation.error,
        });
      }

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

      // Parallel processing of password hashing and geocoding
      const authCtx = await auth.$context;

      const [hashedPassword, coordinates] = await Promise.all([
        isLoginRequired && password
          ? authCtx.password.hash(password)
          : Promise.resolve(null),
        geocodeAddress({
          street,
          city,
          province,
          postalCode,
          country,
        }),
      ]);

      // Verify coordinates
      if (coordinates === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid address - unable to geocode location",
        });
      }

      // Calculate request dates before transaction
      let allRequestDates: Date[] = [];
      const serviceWeekdayId = serviceDay.weekdays[0].id;
      if (isRecurring && endDate) {
        const serviceDayOfWeek = serviceDay.weekdays.map((w) => w.dayOfWeek);
        allRequestDates = getNextOccurrencesOfWeekdays({
          fromDate: normalizedRequestDate,
          allowedWeekdays: serviceDayOfWeek,
          count: 1,
          endDate: normalizedEndDate,
        });
      }

      // Single comprehensive transaction for ALL operations
      const { newUser, newAddress, allRequests, seriesId } =
        await prisma.$transaction(async (tx) => {
          const accountId = authCtx.generateId({ model: "account" });

          if (!accountId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "User account cannot be created",
            });
          }
          // Create user
          const newUser = await tx.user.create({
            data: {
              name: `${firstName} ${lastName}`,
              email,
              phoneNumber: phone || null,
              // password: hashedPassword,
              role: "USER",
              status: "APPROVED",
              isAdminCreated: true,
            },
          });

          // Create account for user
          await tx.account.create({
            data: {
              userId: newUser.id,
              providerId: "credential",
              accountId,
              password: hashedPassword || null,
            },
          });

          // Create default address
          const newAddress = await tx.address.create({
            data: {
              userId: newUser.id,
              name: "Home",
              street,
              city,
              province,
              postalCode,
              country,
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              isDefault: true,
            },
          });

          // Check for duplicate request (within transaction for consistency)
          const existingRequest = await tx.pickupRequest.findFirst({
            where: {
              userId: newUser.id,
              serviceDayId,
              requestDate: normalizedRequestDate,
            },
            select: { id: true },
          });

          if (existingRequest) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "You already have a pickup request for this service",
            });
          }

          let allRequests: PickupRequest[] = [];
          let seriesId: string | null = null;

          if (!isRecurring) {
            // Create single pickup request
            const pickupRequest = await tx.pickupRequest.create({
              data: {
                userId: newUser.id,
                serviceDayId,
                addressId: newAddress.id,
                requestDate: normalizedRequestDate,
                serviceWeekdayId,
                notes,
                status: "PENDING",
                isPickUp,
                isDropOff,
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
            // Create series
            const series = await tx.pickupSeries.create({
              data: {},
            });
            seriesId = series.id;

            // Create all recurring requests in parallel
            const requests = await Promise.all(
              allRequestDates.map((d) =>
                tx.pickupRequest.create({
                  data: {
                    userId: newUser.id,
                    serviceDayId,
                    addressId: newAddress.id,
                    requestDate: d,
                    serviceWeekdayId,
                    isPickUp,
                    isDropOff,
                    notes,
                    status: "PENDING",
                    isGroupRide,
                    numberOfGroup,
                    seriesId: series.id,
                  },
                  include: {
                    serviceDay: true,
                    address: true,
                  },
                })
              )
            );
            allRequests = requests;
          }

          return { newUser, newAddress, allRequests, seriesId };
        }, TRANSACTION_CONFIG);

      // Fire-and-forget analytics (don't block response)
      const analyticsPromises = [
        AnalyticsService.trackEvent({
          eventType: "admin_user_creation",
          userId: newUser.id,
          metadata: { createdBy: ctx.auth.user.id },
        }),
        isRecurring
          ? AnalyticsService.trackEvent({
              eventType: "admin_user_recurring_pickup_request_created",
              userId: newUser.id,
              metadata: {
                adminId: ctx.auth.user.id,
                seriesId,
                serviceDayId,
                dayOfWeek,
                addressId: newAddress.id,
              },
            })
          : AnalyticsService.trackEvent({
              eventType: "admin_user_pickup_request_created",
              userId: newUser.id,
              metadata: {
                admin: ctx.auth.user.id,
                requestId: allRequests[0].id,
                serviceDayId,
                dayOfWeek,
                addressId: newAddress.id,
              },
            }),
      ];

      Promise.all(analyticsPromises).catch((err) =>
        console.error("Analytics tracking failed:", err)
      );

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
        address: {
          id: newAddress.id,
          street: newAddress.street,
          city: newAddress.city,
        },
        requests: allRequests,
        seriesId,
      };
    }),
});
