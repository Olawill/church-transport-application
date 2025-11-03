import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { createTRPCRouter, protectedRoleProcedure } from "@/trpc/init";

export const adminStatRouter = createTRPCRouter({
  getStats: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER]).query(
    async () => {
      const [
        totalUsers,
        activeUsers,
        pendingUsers,
        bannedUsers,
        totalRequests,
        completedRequests,
        pendingRequests,
        cancelledRequests,
        totalDrivers,
        activeDrivers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: "APPROVED", isActive: true } }),
        prisma.user.count({ where: { status: "PENDING" } }),
        prisma.user.count({ where: { status: "BANNED" } }),
        prisma.pickupRequest.count(),
        prisma.pickupRequest.count({ where: { status: "COMPLETED" } }),
        prisma.pickupRequest.count({ where: { status: "PENDING" } }),
        prisma.pickupRequest.count({ where: { status: "CANCELLED" } }),
        prisma.user.count({ where: { role: "TRANSPORTATION_TEAM" } }),
        prisma.user.count({
          where: {
            role: "TRANSPORTATION_TEAM",
            status: "APPROVED",
            isActive: true,
          },
        }),
      ]);

      const completionRate =
        totalRequests > 0
          ? ((completedRequests / totalRequests) * 100).toFixed(1)
          : "0";

      const stats = {
        totalUsers,
        activeUsers,
        pendingUsers,
        bannedUsers,
        totalRequests,
        completedRequests,
        pendingRequests,
        cancelledRequests,
        totalDrivers,
        activeDrivers,
        completionRate,
      };

      return stats;
    }
  ),
});
