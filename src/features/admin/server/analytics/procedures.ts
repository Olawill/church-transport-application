import { UserRole } from "@/generated/prisma";
import { AnalyticsService } from "@/lib/analytics";
import { createTRPCRouter, protectedRoleProcedure } from "@/trpc/init";

export const adminAnalyticsRouter = createTRPCRouter({
  getAnalytics: protectedRoleProcedure(UserRole.ADMIN).query(async () => {
    const [registrations, pickupRequests, driverActivity, popularServiceDays] =
      await Promise.all([
        AnalyticsService.getUserRegistrationStats(30),
        AnalyticsService.getPickupRequestStats(30),
        AnalyticsService.getDriverActivityStats(30),
        AnalyticsService.getPopularServiceDays(),
      ]);

    const analytics = {
      registrations,
      pickupRequests,
      driverActivity,
      popularServiceDays,
    };

    return analytics;
  }),
});
