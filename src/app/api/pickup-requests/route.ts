//api/pickup-request/route.ts
import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  PickupRequest,
  Prisma,
  RequestStatus,
  UserRole,
} from "@/generated/prisma";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { calculateDistance, getNextOccurrencesOfWeekdays } from "@/lib/utils";
import { serverValidateRequest } from "@/types/newRequestSchema";
import {
  convertStringDateToDate,
  TRANSACTION_CONFIG,
  validateDayOfWeek,
  validateEndDateLimit,
  validatePickUpRequestTiming,
} from "@/lib/pickup-utils";

// Zod schema for request validation
const payloadSchema = z
  .object({
    userId: z.string().optional(),
    requestId: z.string().optional(),
    serviceDayId: z.string().min(1),
    addressId: z.string(),
    requestDate: z.string(),
    notes: z.string().optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
    isGroupRide: z.boolean(),
    numberOfGroup: z.number().int().min(2).max(10).nullable(),
    isRecurring: z.boolean(),
    updateSeries: z.boolean().optional(),
    endDate: z.string().optional(),
  })
  .superRefine(serverValidateRequest);

type DuplicationType = {
  serviceDayId: string;
  requestDate: Date;
  userId: string;
  excludeRequestId?: string;
};

const validateRequestDuplicate = async ({
  serviceDayId,
  requestDate,
  userId,
  excludeRequestId,
}: DuplicationType) => {
  const similarRequest = await prisma.pickupRequest.findFirst({
    where: {
      serviceDayId,
      userId,
      requestDate,
      ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
    },
  });

  return !!similarRequest;
};

export const GET = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const requestDate = searchParams.get("requestDate");
    const maxDistance = searchParams.get("maxDistance");

    // const where: Record<string, any> = {};
    const where: Prisma.PickupRequestWhereInput = {};

    const filter = () => {
      if (status) {
        where.status = { equals: status as RequestStatus };
      }

      if (type === "PICKUP") {
        where.isPickUp = true;
      } else if (type === "DROPOFF") {
        where.isDropOff = true;
      }

      if (requestDate) {
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
    };

    // Filter based on user role
    if (session.user.role === UserRole.USER) {
      where.userId = session.user.id;
      filter();
    } else if (session.user.role === UserRole.TRANSPORTATION_TEAM) {
      // For drivers, show requests within their preferred distance
      filter();
    } else if (session.user.role === UserRole.ADMIN) {
      filter();
    }

    const requests = await prisma.pickupRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        serviceDay: true,
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // For transportation team members, filter by distance if coordinates are available
    if (session.user.role === UserRole.TRANSPORTATION_TEAM && maxDistance) {
      const driver = await prisma.user.findUnique({
        where: { id: session.user.id },
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

        return NextResponse.json(filteredRequests);
      }
    }
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching pickup requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== UserRole.USER &&
        session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    const validatedBody = await payloadSchema.safeParseAsync(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }
    const {
      userId,
      serviceDayId,
      addressId,
      requestDate,
      isPickUp,
      isDropOff,
      isGroupRide,
      numberOfGroup,
      isRecurring,
      endDate,
      notes,
    } = validatedBody.data;

    const isAdmin = session.user.role === UserRole.ADMIN;
    const targetUserId = isAdmin ? userId : session.user.id;

    if (isAdmin && !userId) {
      return NextResponse.json(
        { error: "userId is required when creating on behalf of a user" },
        { status: 400 }
      );
    }

    // Optimization: Parallel validation queries instead of sequential
    const [serviceDay, address, existingRequest, existingUser] =
      await Promise.all([
        prisma.serviceDay.findUnique({ where: { id: serviceDayId } }),
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!serviceDay) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pickup request for this service" },
        { status: 409 }
      );
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
      return NextResponse.json(
        { error: timingValidation.error },
        { status: 400 }
      );
    }

    // Validate requestDate has the same day of week
    const dayValidation = validateDayOfWeek(serviceDay, normalizedRequestDate);
    if (!dayValidation.valid) {
      return NextResponse.json({ error: dayValidation.error }, { status: 400 });
    }

    // Validate endDate limit
    const endDateValidation = validateEndDateLimit(
      normalizedEndDate,
      normalizedRequestDate,
      isRecurring
    );
    if (!endDateValidation.valid) {
      return NextResponse.json(
        { error: endDateValidation.error },
        { status: 400 }
      );
    }

    let allRequests: PickupRequest[] = [];
    let seriesId: string | null = null;

    if (!isRecurring) {
      const pickupRequest = await prisma.pickupRequest.create({
        data: {
          userId: targetUserId as string,
          serviceDayId,
          addressId,
          requestDate: normalizedRequestDate,
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
        allowedWeekdays: [serviceDay.dayOfWeek],
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
            adminId: session.user.id,
            ...(isRecurring ? { seriesId } : { requestId: allRequests[0].id }),
            serviceDayId,
            addressId,
          },
        })
      : isRecurring
        ? AnalyticsService.trackEvent({
            eventType: "recurring_pickup_request_created",
            userId: session.user.id,
            metadata: { seriesId, serviceDayId, addressId },
          })
        : AnalyticsService.trackPickupRequest(
            session.user.id,
            allRequests[0].id,
            serviceDayId,
            addressId
          );

    // Don't await analytics - let it complete in background
    trackingPromise.catch((err) =>
      console.error("Analytics tracking failed:", err)
    );

    return NextResponse.json(allRequests, { status: 201 });
  } catch (error) {
    console.error("Error creating pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== UserRole.USER &&
        session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const body = await request.json();
    const validatedBody = await payloadSchema.safeParseAsync(body);
    if (!validatedBody.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }
    const {
      requestId,
      userId,
      serviceDayId,
      addressId,
      requestDate,
      isDropOff,
      isPickUp,
      isGroupRide,
      numberOfGroup,
      notes,
      updateSeries,
    } = validatedBody.data;

    const isAdmin = session.user.role === UserRole.ADMIN;

    const targetUserId = isAdmin ? userId : session.user.id;

    // OPTIMIZATION: Parallel validation queries
    const [existingRequest, serviceDay, address, existingUser] =
      await Promise.all([
        prisma.pickupRequest.findUnique({ where: { id: requestId } }),
        prisma.serviceDay.findUnique({ where: { id: serviceDayId } }),
        prisma.address.findFirst({
          where: { id: addressId, userId: targetUserId },
        }),
        isAdmin && userId
          ? prisma.user.findUnique({ where: { id: userId } })
          : Promise.resolve(true),
      ]);

    // Consolidated validation
    if (isAdmin && !existingUser) {
      return NextResponse.json(
        { error: "User does not exist" },
        { status: 400 }
      );
    }
    if (!existingRequest) {
      return NextResponse.json(
        { error: "The Pickup Request does not exist" },
        { status: 400 }
      );
    }
    if (!serviceDay) {
      return NextResponse.json(
        { error: "Invalid service day" },
        { status: 400 }
      );
    }
    if (!address) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    // Convert requestDate
    const normalizedRequestDate = convertStringDateToDate(requestDate);

    // Check if it's too late to request pickup (less than 1 hour before service)
    const timingValidation = validatePickUpRequestTiming(
      serviceDay,
      normalizedRequestDate
    );
    if (!timingValidation.valid) {
      return NextResponse.json(
        { error: timingValidation.error },
        { status: 400 }
      );
    }

    //Verify requestDate's day is the same as serive day
    const dayValidation = validateDayOfWeek(serviceDay, normalizedRequestDate);
    if (!dayValidation.valid) {
      return NextResponse.json({ error: dayValidation.error }, { status: 400 });
    }

    // array for request updated
    let allUpdatedRequest: PickupRequest[] = [];

    if (!updateSeries) {
      const isSameRequest = await validateRequestDuplicate({
        serviceDayId,
        userId: targetUserId as string,
        requestDate: normalizedRequestDate,
        excludeRequestId: requestId!,
      });

      if (isSameRequest) {
        return NextResponse.json(
          {
            error:
              "You already have a pickup request for this service occurrence",
          },
          { status: 404 }
        );
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
        return NextResponse.json(
          { error: "This request is not part of a series" },
          { status: 400 }
        );
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
            allowedWeekdays: [serviceDay.dayOfWeek],
            count: totalCount,
          });

          if (allDates.length !== requestsToUpdate.length) {
            throw new Error("Error updating service date for the series");
          }

          const duplicates = await Promise.all(
            requestsToUpdate.map((_, index) => {
              return validateRequestDuplicate({
                serviceDayId,
                userId: targetUserId as string,
                requestDate: allDates[index],
              });
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

    // Fire and forget analytics
    // Track pickup request creation
    const trackingPromise = isAdmin
      ? AnalyticsService.trackEvent({
          eventType: updateSeries
            ? "admin_user_recurring_pickup_request_updated"
            : "admin_user_pickup_request_updated",
          userId,
          metadata: {
            adminId: session.user.id,
            ...(updateSeries
              ? { seriesId: existingRequest.seriesId }
              : { requestId: allUpdatedRequest[0].id }),
            serviceDayId,
            addressId,
          },
        })
      : updateSeries
        ? AnalyticsService.trackEvent({
            eventType: "recurring_pickup_request_updated",
            userId: session.user.id,
            metadata: {
              seriesId: existingRequest.seriesId,
              serviceDayId,
              addressId,
            },
          })
        : AnalyticsService.trackEvent({
            eventType: "pickup_request_updated",
            userId: session.user.id,
            metadata: {
              requestId: allUpdatedRequest[0].id,
              serviceDayId,
              addressId,
            },
          });

    // Don't await analytics - let it complete in background
    trackingPromise.catch((err) =>
      console.error("Analytics tracking failed:", err)
    );

    return NextResponse.json(allUpdatedRequest, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_REQUEST") {
      return NextResponse.json(
        { error: "You already have service matching one in the series" },
        { status: 409 }
      );
    }
    console.error("Error updating pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Request ID is required" },
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

    // Users can only update their own requests
    if (
      session.user.role === UserRole.USER &&
      existingRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Transportation team can accept/deny requests
    if (
      session.user.role === UserRole.TRANSPORTATION_TEAM &&
      status === "ACCEPTED"
    ) {
      body.driverId = session.user.id;
    }

    const { driverId } = body;

    let distance = null;
    if (driverId || existingRequest.driverId) {
      const driverAddress = await prisma.address.findFirst({
        where: {
          userId: driverId || existingRequest.driverId,
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
    }

    const updatedRequest = await prisma.pickupRequest.update({
      where: { id },
      data: {
        status: status || existingRequest.status,
        driverId: driverId || existingRequest.driverId,
        distance,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        serviceDay: true,
        address: true,
      },
    });

    // Track events based on status changes
    if (
      status === "ACCEPTED" &&
      session.user.role === UserRole.TRANSPORTATION_TEAM
    ) {
      await AnalyticsService.trackDriverAcceptance(
        session.user.id,
        id,
        existingRequest.userId
      );
    } else if (
      status === "COMPLETED" &&
      session.user.role === UserRole.TRANSPORTATION_TEAM
    ) {
      await AnalyticsService.trackPickupCompletion(
        session.user.id,
        id,
        existingRequest.userId
      );
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
