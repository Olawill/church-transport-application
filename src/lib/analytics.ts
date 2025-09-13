import { prisma } from "./db";

export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  value?: number;
}

type ServiceDayStatsType = {
  serviceDayId: string;
  count: number;
};

export class AnalyticsService {
  /**
   * Track an analytics event
   */
  static async trackEvent({
    eventType,
    userId,
    metadata,
    value,
  }: AnalyticsEvent): Promise<void> {
    try {
      await prisma.analytics.create({
        data: {
          eventType,
          userId,
          metadata: metadata ? JSON.stringify(metadata) : null,
          value,
        },
      });
    } catch (error) {
      console.error("Analytics tracking error:", error);
    }
  }

  /**
   * Track user registration event
   */
  static async trackUserRegistration(
    userId: string,
    method: "email" | "oauth",
    provider?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: "user_registration",
      userId,
      metadata: {
        method,
        provider,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track pickup request creation
   */
  static async trackPickupRequest(
    userId: string,
    requestId: string,
    serviceDayId: string,
    addressId: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: "pickup_request",
      userId,
      metadata: {
        requestId,
        serviceDayId,
        addressId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track driver acceptance of a pickup request
   */
  static async trackDriverAcceptance(
    driverId: string,
    requestId: string,
    userId: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: "driver_acceptance",
      userId: driverId,
      metadata: {
        requestId,
        passengerUserId: userId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track pickup completion
   */
  static async trackPickupCompletion(
    driverId: string,
    requestId: string,
    userId: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: "pickup_completion",
      userId: driverId,
      metadata: {
        requestId,
        passengerUserId: userId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track OAuth profile completion
   */
  static async trackOAuthCompletion(
    userId: string,
    provider: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: "oauth_completion",
      userId,
      metadata: {
        provider,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get user registration statistics
   */
  static async getUserRegistrationStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const registrations = await prisma.analytics.groupBy({
      by: ["date"],
      where: {
        eventType: "user_registration",
        date: { gte: startDate },
      },
      _count: { id: true },
      orderBy: { date: "asc" },
    });

    const result = registrations.reduce(
      (acc, item) => {
        const date = item.date.toISOString().split("T")[0];

        // If the date already exists, increment the count
        const existing = acc.find((entry) => entry.date === date);
        if (existing) {
          existing.count += item._count.id;
        } else {
          acc.push({ date, count: item._count.id });
        }

        return acc;
      },
      [] as { date: string; count: number }[]
    );

    return result;
    // return registrations.map((item) => ({
    //   date: item.date.toISOString().split("T")[0],
    //   count: item._count.id,
    // }));
    // try {
    //   const registrations = await prisma.analytics.findMany({
    //     where: {
    //       eventType: "user_registration",
    //       createdAt: {
    //         gte: startDate,
    //       },
    //     },
    //     orderBy: {
    //       createdAt: "desc",
    //     },
    //   });

    //   return {
    //     total: registrations.length,
    //     byMethod: registrations.reduce((acc: Record<string, number>, reg) => {
    //       const method = JSON.parse(reg.metadata || "{}").method || "unknown";
    //       acc[method] = (acc[method] || 0) + 1;
    //       return acc;
    //     }, {}),
    //     daily: registrations.reduce((acc: Record<string, number>, reg) => {
    //       const date = reg.createdAt.toISOString().split("T")[0];
    //       acc[date] = (acc[date] || 0) + 1;
    //       return acc;
    //     }, {}),
    //   };
    // } catch (error) {
    //   console.error("Error fetching user registration stats:", error);
    //   return { total: 0, byMethod: {}, daily: {} };
    // }
  }

  /**
   * Get pickup request statistics
   */
  static async getPickupRequestStats(days: number = 30) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - days);

    const requests = await prisma.analytics.groupBy({
      by: ["date"],
      where: {
        eventType: "pickup_request",
        date: { gte: startDate },
      },
      _count: { id: true },
      orderBy: { date: "asc" },
    });

    const result = requests.reduce(
      (acc, item) => {
        const date = item.date.toISOString().split("T")[0];

        // If the date already exists, increment the count
        const existing = acc.find((entry) => entry.date === date);
        if (existing) {
          existing.count += item._count.id;
        } else {
          acc.push({ date, count: item._count.id });
        }

        return acc;
      },
      [] as { date: string; count: number }[]
    );

    // console.log(result);

    // return requests.map((item) => ({
    //   date: item.date.toISOString().split("T")[0],
    //   count: item._count.id,
    // }));
    return result;

    // try {
    //   const requests = await prisma.analytics.findMany({
    //     where: {
    //       eventType: "pickup_request",
    //       createdAt: {
    //         gte: startDate,
    //       },
    //     },
    //     orderBy: {
    //       createdAt: "desc",
    //     },
    //   });

    //   return {
    //     total: requests.length,
    //     daily: requests.reduce((acc: Record<string, number>, req) => {
    //       const date = req.createdAt.toISOString().split("T")[0];
    //       acc[date] = (acc[date] || 0) + 1;
    //       return acc;
    //     }, {}),
    //   };
    // } catch (error) {
    //   console.error("Error fetching pickup request stats:", error);
    //   return { total: 0, daily: {} };
    // }
  }

  /**
   * Get driver activity statistics
   */
  static async getDriverActivityStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const acceptances = await prisma.analytics.groupBy({
      by: ["userId"],
      where: {
        eventType: "driver_acceptance",
        date: { gte: startDate },
        userId: { not: null },
      },
      _count: { id: true },
    });

    const completions = await prisma.analytics.groupBy({
      by: ["userId"],
      where: {
        eventType: "pickup_completion",
        date: { gte: startDate },
        userId: { not: null },
      },
      _count: { id: true },
    });

    const cancellations = await prisma.analytics.groupBy({
      by: ["userId"],
      where: {
        eventType: "driver_pickup_cancellation",
        date: { gte: startDate },
        userId: { not: null },
      },
      _count: { id: true },
    });

    // Get driver details
    const driverIds = [
      ...new Set(
        [
          ...acceptances.map((a) => a.userId),
          ...completions.map((c) => c.userId),
          ...cancellations.map((c) => c.userId),
        ].filter(Boolean)
      ),
    ];

    const drivers = await prisma.user.findMany({
      where: { id: { in: driverIds as string[] } },
      select: { id: true, firstName: true, lastName: true },
    });

    return drivers.map((driver) => {
      const acceptance = acceptances.find((a) => a.userId === driver.id);
      const completion = completions.find((c) => c.userId === driver.id);
      const cancellation = cancellations.find((c) => c.userId === driver.id);

      return {
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        acceptances: acceptance?._count.id || 0,
        completions: completion?._count.id || 0,
        cancellations: cancellation?._count.id || 0,
      };
    });

    //   try {
    //   const acceptances = await prisma.analytics.findMany({
    //     where: {
    //       eventType: 'driver_acceptance',
    //       createdAt: {
    //         gte: startDate,
    //       },
    //     },
    //   });

    //   const completions = await prisma.analytics.findMany({
    //     where: {
    //       eventType: 'pickup_completion',
    //       createdAt: {
    //         gte: startDate,
    //       },
    //     },
    //   });

    //   return {
    //     acceptances: acceptances.length,
    //     completions: completions.length,
    //     completionRate: acceptances.length > 0 ? (completions.length / acceptances.length) * 100 : 0,
    //   };
    // } catch (error) {
    //   console.error('Error fetching driver activity stats:', error);
    //   return { acceptances: 0, completions: 0, completionRate: 0 };
    // }
  }

  /**
   * Get popular service days
   */
  static async getPopularServiceDays() {
    const serviceDayRequests = await prisma.analytics.findMany({
      where: {
        eventType: "pickup_request",
      },
    });

    // Group by service day from metadata
    const serviceDayStats: Record<string, number> = {};

    for (const request of serviceDayRequests) {
      if (request.metadata) {
        try {
          const metadata = JSON.parse(request.metadata);
          const serviceDayId = metadata.serviceDayId;
          if (serviceDayId) {
            serviceDayStats[serviceDayId] =
              (serviceDayStats[serviceDayId] || 0) + 1;
          }
        } catch (error) {
          // Skip invalid metadata
          console.error("Invalid metadata:", error);
        }
      }
    }

    // Get service day details
    const serviceDays = await prisma.serviceDay.findMany({
      where: { id: { in: Object.keys(serviceDayStats) } },
    });

    return serviceDays
      .map((serviceDay) => ({
        id: serviceDay.id,
        name: serviceDay.name,
        dayOfWeek: serviceDay.dayOfWeek,
        time: serviceDay.time,
        requestCount: serviceDayStats[serviceDay.id] || 0,
      }))
      .sort((a, b) => b.requestCount - a.requestCount);

    // try {
    //   const requests = await prisma.analytics.findMany({
    //     where: {
    //       eventType: "pickup_request",
    //     },
    //   });

    //   const serviceDayStats = requests.reduce(
    //     (acc: Record<string, number>, req) => {
    //       const serviceDayId = JSON.parse(req.metadata || "{}").serviceDayId;
    //       if (serviceDayId) {
    //         acc[serviceDayId] = (acc[serviceDayId] || 0) + 1;
    //       }
    //       return acc;
    //     },
    //     {}
    //   );

    //   // Convert to array and sort by popularity
    //   const sorted = Object.entries(serviceDayStats)
    //     .map(([serviceDayId, count]) => ({ serviceDayId, count }))
    //     .sort(
    //       (a: ServiceDayStatsType, b: ServiceDayStatsType) => b.count - a.count
    //     );

    //   return sorted.slice(0, 5); // Return top 5
    // } catch (error) {
    //   console.error("Error fetching popular service days:", error);
    //   return [];
    // }
  }

  static async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalRequests,
      completedRequests,
      totalDrivers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "APPROVED", isActive: true } }),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.pickupRequest.count(),
      prisma.pickupRequest.count({ where: { status: "COMPLETED" } }),
      prisma.user.count({ where: { role: "TRANSPORTATION_TEAM" } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      totalRequests,
      completedRequests,
      totalDrivers,
      completionRate:
        totalRequests > 0
          ? ((completedRequests / totalRequests) * 100).toFixed(1)
          : "0",
    };
  }
}
