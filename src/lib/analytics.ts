import { prisma } from "./db";
import { getDayNameFromNumber } from "./utils";

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
    addressId: string,
    dayOfWeek: number
  ): Promise<void> {
    await this.trackEvent({
      eventType: "pickup_request",
      userId,
      metadata: {
        requestId,
        serviceDayId,
        dayOfWeek,
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
  static async getPopularServiceDays(options?: {
    startDate?: Date;
    endDate?: Date;
    days?: number; // e.g., 7 for past 7 days, 30 for past 30 days
  }) {
    try {
      // Determine the date range
      const now = new Date();
      let startDate: Date;
      const endDate: Date = options?.endDate || now;

      if (options?.startDate) {
        startDate = options.startDate;
      } else if (options?.days) {
        startDate = new Date(
          now.getTime() - options.days * 24 * 60 * 60 * 1000
        );
      } else {
        // Default to past 30 days
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get all pickup request analytics events
      const serviceDayRequests = await prisma.analytics.findMany({
        where: {
          eventType: "pickup_request",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          metadata: true,
        },
      });

      // Group by service day from metadata
      const serviceDayStats: Record<string, number> = {};
      const serviceDayWeekdays: Record<string, Record<number, number>> = {};

      for (const request of serviceDayRequests) {
        if (!request.metadata) continue;

        try {
          const metadata = JSON.parse(request.metadata);
          const serviceDayId = metadata?.serviceDayId;
          const dayOfWeek = metadata?.dayOfWeek;

          if (typeof serviceDayId === "string") {
            serviceDayStats[serviceDayId] =
              (serviceDayStats[serviceDayId] || 0) + 1;

            // Track which weekdays are most popular for this service
            if (typeof dayOfWeek === "number") {
              if (!serviceDayWeekdays[serviceDayId]) {
                serviceDayWeekdays[serviceDayId] = {};
              }
              serviceDayWeekdays[serviceDayId][dayOfWeek] =
                (serviceDayWeekdays[serviceDayId][dayOfWeek] || 0) + 1;
            }
          }
        } catch (err) {
          console.error("Failed to parse metadata for analytics row:", err);
        }
      }

      const serviceDayIds = Object.keys(serviceDayStats);
      if (serviceDayIds.length === 0) return [];

      // Step 3: Get matching ServiceDay records
      const serviceDays = await prisma.serviceDay.findMany({
        where: { id: { in: serviceDayIds }, isActive: true },
        include: {
          weekdays: {
            orderBy: {
              dayOfWeek: "asc",
            },
          },
        },
      });

      return serviceDays
        .map((serviceDay) => {
          // Get the most popular weekday for this service from metadata
          const weekdayStats = serviceDayWeekdays[serviceDay.id] || {};
          const mostPopularDayOfWeek = Object.entries(weekdayStats)
            .sort(
              ([, countA], [, countB]) =>
                (countB as number) - (countA as number)
            )
            .map(([day]) => Number(day))[0];

          // Format all weekdays as a comma-separated string
          const weekdayNames = serviceDay.weekdays
            .map((w) => getDayNameFromNumber(w.dayOfWeek))
            .join(", ");

          return {
            id: serviceDay.id,
            name: serviceDay.name,
            time: serviceDay.time,
            serviceType: serviceDay.serviceType,
            serviceCategory: serviceDay.serviceCategory,
            frequency: serviceDay.frequency,
            // All weekdays with their request counts
            weekdays: serviceDay.weekdays.map((w) => ({
              id: w.id,
              dayOfWeek: w.dayOfWeek,
              dayName: getDayNameFromNumber(w.dayOfWeek),
              requestCount: weekdayStats[w.dayOfWeek] || 0,
            })),
            // Formatted string of all available days
            daysOfWeek: weekdayNames,
            // Most popular weekday name based on actual requests
            dayOfWeek:
              mostPopularDayOfWeek !== undefined
                ? getDayNameFromNumber(mostPopularDayOfWeek)
                : serviceDay.weekdays[0]
                  ? getDayNameFromNumber(serviceDay.weekdays[0].dayOfWeek)
                  : null,
            requestCount: serviceDayStats[serviceDay.id] || 0,
          };
        })
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 5); // Return top 5
    } catch (error) {
      console.error("Error fetching popular service days:", error);
      return [];
    }

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
