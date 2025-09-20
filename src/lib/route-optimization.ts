import { RouteStatus } from "@/generated/prisma";
import { prisma } from "./db";
import { calculateDistance } from "./utils";

// Coordinates interface
export interface Coordinates {
  lat: number;
  lng: number;
  address?: string;
}

// Pickup request with location data
interface PickupRequestWithLocation {
  id: string;
  userId: string;
  addressId: string;
  notes?: string;
  priority: number;
  estimatedTime?: number;
  address: {
    id: string;
    name: string;
    street: string;
    city: string;
    province: string;
    latitude?: number;
    longitude?: number;
  };
  user: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

// Optimized route result
interface OptimizedRoute {
  orderedPickups: string[]; // Array of pickup request IDs in optimal order
  totalDistance: number;
  estimatedTime: number;
  optimizationScore: number;
  routeLegs: RouteLeg[];
}

interface RouteLeg {
  from: Coordinates;
  to: Coordinates;
  distance: number;
  duration: number;
  pickupRequestId: string;
}

const optimizeRouteOrder = (
  startLocation: Coordinates,
  pickupRequests: PickupRequestWithLocation[]
): OptimizedRoute => {
  if (pickupRequests.length === 0) {
    return {
      orderedPickups: [],
      totalDistance: 0,
      estimatedTime: 0,
      optimizationScore: 100,
      routeLegs: [],
    };
  }

  // Sort by priority first (higher priority = earlier pickup)
  const sortedByPriority = [...pickupRequests].sort(
    (a, b) => b.priority - a.priority
  );

  // Group high-priority requests (priority > 0) and regular requests
  const highPriorityRequests = sortedByPriority.filter((r) => r.priority > 0);
  const regularRequests = sortedByPriority.filter((r) => r.priority <= 0);

  // Optimize high-priority requests first
  const optimizedHigh = optimizeNearestNeighbor(
    startLocation,
    highPriorityRequests
  );

  // Then optimize regular requests starting from last high-priority location
  let continueFrom = startLocation;
  if (optimizedHigh.routeLegs.length > 0) {
    const lastLeg = optimizedHigh.routeLegs[optimizedHigh.routeLegs.length - 1];
    continueFrom = lastLeg.to;
  }

  const optimizedRegular = optimizeNearestNeighbor(
    continueFrom,
    regularRequests
  );

  // Combine the results
  return {
    orderedPickups: [
      ...optimizedHigh.orderedPickups,
      ...optimizedRegular.orderedPickups,
    ],
    totalDistance: optimizedHigh.totalDistance + optimizedRegular.totalDistance,
    estimatedTime: optimizedHigh.estimatedTime + optimizedRegular.estimatedTime,
    optimizationScore: calculateOptimizationScore(
      optimizedHigh.totalDistance + optimizedRegular.totalDistance,
      pickupRequests.length
    ),
    routeLegs: [...optimizedHigh.routeLegs, ...optimizedRegular.routeLegs],
  };
};

const optimizeNearestNeighbor = (
  startLocation: Coordinates,
  pickupRequests: PickupRequestWithLocation[]
): OptimizedRoute => {
  if (pickupRequests.length === 0) {
    return {
      orderedPickups: [],
      totalDistance: 0,
      estimatedTime: 0,
      optimizationScore: 100,
      routeLegs: [],
    };
  }

  const orderedPickups: string[] = [];
  const routeLegs: RouteLeg[] = [];
  const remaining = [...pickupRequests];
  let currentLocation = startLocation;
  let totalDistance = 0;
  let totalTime = 0;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    // Find nearest unvisited pickup
    for (let i = 0; i < remaining.length; i++) {
      const pickup = remaining[i];
      const coords = {
        lat: pickup.address.latitude || 0,
        lng: pickup.address.longitude || 0,
      };

      const distance = calculateDistance(currentLocation, coords);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    // Add nearest pickup to route
    const nearestPickup = remaining[nearestIndex];
    const pickupCoords = {
      lat: nearestPickup.address.latitude || 0,
      lng: nearestPickup.address.longitude || 0,
      address: `${nearestPickup.address.street}, ${nearestPickup.address.city}`,
    };

    orderedPickups.push(nearestPickup.id);

    // Estimate duration (average 30 km/h in city + 2 minutes pickup time)
    const legDuration = (nearestDistance / 30) * 60 + 2; // minutes

    routeLegs.push({
      from: currentLocation,
      to: pickupCoords,
      distance: nearestDistance,
      duration: legDuration,
      pickupRequestId: nearestPickup.id,
    });

    totalDistance += nearestDistance;
    totalTime += legDuration;
    currentLocation = pickupCoords;
    remaining.splice(nearestIndex, 1);
  }

  return {
    orderedPickups,
    totalDistance,
    estimatedTime: Math.round(totalTime),
    optimizationScore: calculateOptimizationScore(
      totalDistance,
      pickupRequests.length
    ),
    routeLegs,
  };
};

const calculateOptimizationScore = (
  totalDistance: number,
  numPickups: number
): number => {
  if (numPickups === 0) return 100;

  // Base score calculation: fewer km per pickup = better score
  const avgDistancePerPickup = totalDistance / numPickups;

  // Optimal would be around 2km per pickup, score decreases as it gets higher
  const score = Math.max(0, 100 - (avgDistancePerPickup - 2) * 10);

  return Math.round(Math.min(100, Math.max(0, score)));
};

// Main route optimization function
export const optimizeRoute = async (
  organizationId: string,
  driverId: string,
  serviceDayId: string,
  routeDate: Date,
  pickupRequestIds: string[],
  startLocation: Coordinates
): Promise<string> => {
  // Get pickup requests with location data
  const pickupRequests = (await prisma.pickupRequest.findMany({
    where: {
      id: { in: pickupRequestIds },
      organizationId,
      status: "PENDING",
    },
    include: {
      address: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  })) as PickupRequestWithLocation[];

  if (pickupRequests.length === 0) {
    throw new Error("No valid pickup requests found");
  }

  // Filter out requests without coordinates
  const requestsWithCoords = pickupRequests.filter(
    (r) => r.address.latitude && r.address.longitude
  );

  if (requestsWithCoords.length === 0) {
    throw new Error("No pickup requests have valid coordinates");
  }

  // Optimize the route
  const optimizedRoute = optimizeRouteOrder(startLocation, requestsWithCoords);

  // Create route record
  const route = await prisma.route.create({
    data: {
      organizationId,
      driverId,
      serviceDayId,
      routeDate,
      status: RouteStatus.PLANNED,
      startLocation: JSON.stringify(startLocation),
      totalDistance: optimizedRoute.totalDistance,
      estimatedTime: optimizedRoute.estimatedTime,
      optimizedOrder: JSON.stringify(optimizedRoute.orderedPickups),
      optimizationScore: optimizedRoute.optimizationScore,
    },
  });

  // Update pickup requests with route and estimated times
  for (let i = 0; i < optimizedRoute.orderedPickups.length; i++) {
    const pickupId = optimizedRoute.orderedPickups[i];
    const routeLeg = optimizedRoute.routeLegs[i];

    await prisma.pickupRequest.update({
      where: { id: pickupId },
      data: {
        routeId: route.id,
        estimatedTime: routeLeg.duration,
        distance: routeLeg.distance,
      },
    });
  }

  return route.id;
};

// Get optimized route for display
export const getOptimizedRoute = async (routeId: string) => {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      pickupRequests: {
        include: {
          address: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: {
          estimatedTime: "asc", // Order by estimated pickup time
        },
      },
      driver: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });

  if (!route) {
    throw new Error("Route not found");
  }

  const startLocation = JSON.parse(route.startLocation);
  const optimizedOrder = JSON.parse(route.optimizedOrder);

  // Reorder pickup requests according to optimized order
  const orderedPickups = optimizedOrder
    .map((pickupId: string) =>
      route.pickupRequests.find((p) => p.id === pickupId)
    )
    .filter(Boolean);

  return {
    ...route,
    startLocation,
    optimizedOrder,
    orderedPickups,
  };
};

// Update route status and tracking
export const updateRouteStatus = async (
  routeId: string,
  status: RouteStatus,
  actualStartTime?: Date,
  actualEndTime?: Date
) => {
  const updateData: Record<string, string | Date> = { status };

  if (actualStartTime) {
    updateData.actualStartTime = actualStartTime;
  }

  if (actualEndTime) {
    updateData.actualEndTime = actualEndTime;
  }

  return await prisma.route.update({
    where: { id: routeId },
    data: updateData,
  });
};

// Get driver's routes
export const getDriverRoutes = async (
  organizationId: string,
  driverId: string,
  dateFrom?: Date,
  dateTo?: Date
) => {
  const where: Record<string, string | Record<string, Date>> = {
    organizationId,
    driverId,
  };

  if (dateFrom && dateTo) {
    where.routeDate = {
      gte: dateFrom,
      lte: dateTo,
    };
  }

  return await prisma.route.findMany({
    where,
    include: {
      pickupRequests: {
        include: {
          address: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: {
      routeDate: "desc",
    },
  });
};

// Route analytics
export const getRouteAnalytics = async (
  organizationId: string,
  dateFrom: Date,
  dateTo: Date
) => {
  const routes = await prisma.route.findMany({
    where: {
      organizationId,
      routeDate: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    include: {
      pickupRequests: true,
    },
  });

  const analytics = {
    totalRoutes: routes.length,
    completedRoutes: routes.filter((r) => r.status === "COMPLETED").length,
    totalDistance: routes.reduce((sum, r) => sum + r.totalDistance, 0),
    totalPickups: routes.reduce((sum, r) => sum + r.pickupRequests.length, 0),
    averageOptimizationScore:
      routes.length > 0
        ? routes.reduce((sum, r) => sum + (r.optimizationScore || 0), 0) /
          routes.length
        : 0,
    averageDistancePerRoute:
      routes.length > 0
        ? routes.reduce((sum, r) => sum + r.totalDistance, 0) / routes.length
        : 0,
    averagePickupsPerRoute:
      routes.length > 0
        ? routes.reduce((sum, r) => sum + r.pickupRequests.length, 0) /
          routes.length
        : 0,
  };

  return analytics;
};
