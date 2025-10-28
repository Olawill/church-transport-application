import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/screen-states/error-state";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { TransportationTeamDashboard } from "@/features/dashboard/components/transportation-dashboard";
import { UserDashboard } from "@/features/dashboard/components/user-dashboard";

import { UserRole } from "@/generated/prisma";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { LoadingState } from "@/components/screen-states/loading-state";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  const session = await requireAuth();

  const userRole = session.user.role;

  // Admin Dashboard Data Prefetching
  prefetch(trpc.adminStats.getStats.queryOptions());
  prefetch(trpc.adminUsers.getUsers.queryOptions());
  prefetch(trpc.adminAnalytics.getAnalytics.queryOptions());

  // User Dashboard Data Prefetching
  prefetch(trpc.userRequests.getUserRequests.queryOptions({}));

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Dashboard Failed to Load"
            description="An error occurred while loading the dashboard. Please try again or contact support if the issue continues."
          />
        }
      >
        <Suspense
          fallback={
            <LoadingState
              title="Dashboard Loading..."
              description="Please wait while we load your dashboard."
            />
          }
        >
          {userRole === UserRole.ADMIN && <AdminDashboard />}

          {userRole === UserRole.TRANSPORTATION_TEAM && (
            <TransportationTeamDashboard />
          )}

          {userRole === UserRole.USER && <UserDashboard />}
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default DashboardPage;
