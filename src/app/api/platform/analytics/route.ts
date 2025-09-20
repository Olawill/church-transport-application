import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Get platform analytics (Platform Admin only)
export const GET = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.PLATFORM_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // Get platform-wide statistics
    const [
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      totalSubscriptions,
      recentOrganizations,
      recentUsers,
      subscriptionsByPlan,
      subscriptionsByStatus,
      monthlyRevenue,
      pickupRequestStats,
    ] = await Promise.all([
      // Total organizations
      prisma.organization.count(),

      // Active organizations (not suspended)
      prisma.organization.count({
        where: {
          isActive: true,
          isSuspended: false,
        },
      }),

      // Total users
      prisma.user.count(),

      // Total subscriptions
      prisma.subscription.count(),

      // Recent organizations (last 30 days)
      prisma.organization.count({
        where: {
          createdAt: {
            gte: dateFrom,
          },
        },
      }),

      // Recent users (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: dateFrom,
          },
        },
      }),

      // Subscriptions by plan
      prisma.subscription.groupBy({
        by: ["plan"],
        _count: {
          id: true,
        },
      }),

      // Subscriptions by status
      prisma.subscription.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      }),

      // Monthly revenue (sum of all active subscriptions)
      prisma.subscription.aggregate({
        where: {
          status: "ACTIVE",
        },
        _sum: {
          totalPrice: true,
        },
      }),

      // Pickup request stats
      prisma.pickupRequest.groupBy({
        by: ["status"],
        where: {
          requestDate: {
            gte: dateFrom,
          },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Get top organizations by usage
    const topOrganizations = await prisma.organization.findMany({
      include: {
        subscription: true,
        _count: {
          select: {
            users: true,
            pickupRequests: true,
          },
        },
      },
      orderBy: {
        users: {
          _count: "desc",
        },
      },
      take: 10,
    });

    // Format subscription data
    const formattedSubscriptionsByPlan = subscriptionsByPlan.reduce(
      (acc, item) => {
        acc[item.plan] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    const formattedSubscriptionsByStatus = subscriptionsByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    const formattedPickupStats = pickupRequestStats.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate growth rates (simplified)
    const prevDateFrom = new Date(dateFrom);
    prevDateFrom.setDate(prevDateFrom.getDate() - days);

    const [prevOrganizations, prevUsers] = await Promise.all([
      prisma.organization.count({
        where: {
          createdAt: {
            gte: prevDateFrom,
            lt: dateFrom,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: prevDateFrom,
            lt: dateFrom,
          },
        },
      }),
    ]);

    const organizationGrowth =
      prevOrganizations > 0
        ? ((recentOrganizations - prevOrganizations) / prevOrganizations) * 100
        : 0;

    const userGrowth =
      prevUsers > 0 ? ((recentUsers - prevUsers) / prevUsers) * 100 : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalOrganizations,
          activeOrganizations,
          totalUsers,
          totalSubscriptions,
          monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
        },
        growth: {
          recentOrganizations,
          recentUsers,
          organizationGrowth: Math.round(organizationGrowth * 100) / 100,
          userGrowth: Math.round(userGrowth * 100) / 100,
        },
        subscriptions: {
          byPlan: formattedSubscriptionsByPlan,
          byStatus: formattedSubscriptionsByStatus,
        },
        pickupRequests: formattedPickupStats,
        topOrganizations: topOrganizations.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          userCount: org._count.users,
          requestCount: org._count.pickupRequests,
          plan: org.subscription?.plan,
          revenue: org.subscription?.totalPrice || 0,
        })),
        period: {
          days,
          from: dateFrom.toISOString(),
          to: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Platform get analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
