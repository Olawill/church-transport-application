import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { Prisma, RequestStatus, UserRole } from "@/generated/prisma";
import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { calculateDistance } from "@/lib/utils";

export const GET = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const {
      userId,
      serviceDayId,
      addressId,
      requestDate,
      isPickUp,
      isDropOff,
      isGroupRide,
      numberOfGroup,
      notes,
    } = body;

    const isAdmin = session.user.role === UserRole.ADMIN;

    if (isAdmin) {
      if (!userId) {
        return NextResponse.json(
          { error: "User does not exist" },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!existingUser) {
        return NextResponse.json(
          { error: "User does not exist" },
          { status: 400 }
        );
      }
    }

    // Required fields
    if (
      !serviceDayId ||
      !addressId ||
      !requestDate ||
      (!isPickUp && !isDropOff)
    ) {
      return NextResponse.json(
        {
          error:
            "Service day, address, request date, isPickUp, and isDropOff are required",
        },
        { status: 400 }
      );
    }

    // Check if it's too late to request pickup (less than 1 hour before service)
    const serviceDateTime = new Date(requestDate);

    if (isNaN(serviceDateTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid request date" },
        { status: 400 }
      );
    }

    const serviceDay = await prisma.serviceDay.findUnique({
      where: { id: serviceDayId },
    });
    if (!serviceDay) {
      return NextResponse.json(
        { error: "Invalid service day" },
        { status: 400 }
      );
    }

    // Ensure request is at least 1 hour before service
    const [hh, mm] = serviceDay.time.split(":").map((n) => parseInt(n, 10));
    const serviceStart = new Date(serviceDateTime);
    serviceStart.setHours(hh || 0, mm || 0, 0, 0);
    const cutoff = new Date(serviceStart.getTime() - 60 * 60 * 1000);

    if (Date.now() > cutoff.getTime()) {
      return NextResponse.json(
        {
          error: "Cannot request pickup less than 1 hour before service time",
        },
        { status: 400 }
      );
    }

    // Validate that the user owns the address
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: isAdmin ? userId : session.user.id,
      },
    });

    if (!address) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    // Check if user already has a request for this service day and date
    const existingRequest = await prisma.pickupRequest.findFirst({
      where: {
        userId: isAdmin ? userId : session.user.id,
        serviceDayId,
        requestDate: serviceDateTime,
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pickup request for this service" },
        { status: 400 }
      );
    }

    const pickupRequest = await prisma.pickupRequest.create({
      data: {
        userId: isAdmin ? userId : session.user.id,
        serviceDayId,
        addressId,
        requestDate: serviceDateTime,
        isPickUp,
        isDropOff,
        notes: notes || null,
        status: "PENDING",
        isGroupRide,
        numberOfGroup,
      },
      include: {
        serviceDay: true,
        address: true,
      },
    });

    // Track pickup request creation
    if (isAdmin) {
      await AnalyticsService.trackEvent({
        eventType: "admin_user_pickup_request_created",
        userId,
        metadata: {
          adminId: session.user.id,
          requestId: pickupRequest.id,
          serviceDayId,
          addressId,
        },
      });
    } else {
      await AnalyticsService.trackPickupRequest(
        session.user.id,
        pickupRequest.id,
        serviceDayId,
        addressId
      );
    }

    return NextResponse.json(pickupRequest, { status: 201 });
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
    } = body;

    const isAdmin = session.user.role === UserRole.ADMIN;

    if (isAdmin) {
      if (!userId) {
        return NextResponse.json(
          {
            error: "User not found",
          },
          { status: 400 }
        );
      }

      // Check if the user exists
      const existingUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          { error: "User does not exist" },
          { status: 400 }
        );
      }
    }

    if (
      !requestId ||
      !serviceDayId ||
      !addressId ||
      !requestDate ||
      (!isDropOff && !isPickUp)
    ) {
      return NextResponse.json(
        {
          error:
            "Request, Service day, address, request date, isPickUp, and isDropOff are required",
        },
        { status: 400 }
      );
    }

    // Check if it's too late to request pickup (less than 1 hour before service)
    const serviceDateTime = new Date(requestDate);
    const serviceDay = await prisma.serviceDay.findUnique({
      where: { id: serviceDayId },
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
    const cutoff = new Date(serviceStart.getTime() - 60 * 60 * 1000);

    if (Date.now() > cutoff.getTime()) {
      return NextResponse.json(
        {
          error: "Cannot request pickup less than 1 hour before service time",
        },
        { status: 400 }
      );
    }

    // Validate that the user owns the address
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: isAdmin ? userId : session.user.id,
      },
    });

    if (!address) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    // Check if user already has a request for this service day and date
    const existingRequest = await prisma.pickupRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "The Pickup Request does not exist" },
        { status: 400 }
      );
    }

    const pickupRequest = await prisma.pickupRequest.update({
      where: {
        id: requestId,
      },
      data: {
        serviceDayId,
        addressId,
        requestDate: serviceDateTime,
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

    // Track pickup request creation
    if (isAdmin) {
      await AnalyticsService.trackEvent({
        eventType: "admin_user_pickup_request_updated",
        userId,
        metadata: {
          adminId: session.user.id,
          requestId: pickupRequest.id,
          serviceDayId,
          addressId,
        },
      });
    } else {
      await AnalyticsService.trackEvent({
        eventType: "pickup_request_updated",
        userId: session.user.id,
        metadata: {
          requestId,
          serviceDayId,
          addressId,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(pickupRequest, { status: 201 });
  } catch (error) {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
