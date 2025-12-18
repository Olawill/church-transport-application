import { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/screen-states/error-state";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { TransportationTeamDashboard } from "@/features/dashboard/components/transportation-dashboard";
import { UserDashboard } from "@/features/dashboard/components/user-dashboard";
import { adminDashboardParamsLoader } from "@/features/dashboard/params-loader";

import { LoadingState } from "@/components/screen-states/loading-state";
import { UserRole } from "@/generated/prisma/enums";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

// export const dynamic = "force-dynamic";
type Props = {
  searchParams: Promise<SearchParams>;
};

const DashboardPage = async ({ searchParams }: Props) => {
  const session = await requireAuth();

  const userRole = session.user.role;

  const {
    user: search,
    page,
    pageSize,
  } = await adminDashboardParamsLoader(searchParams);

  // Admin Dashboard Data Prefetching
  if (userRole === UserRole.ADMIN) {
    prefetch(trpc.adminStats.getStats.queryOptions());
    prefetch(
      trpc.users.getPaginatedUsers.queryOptions({
        search,
        page,
        pageSize,
      })
    );
    prefetch(trpc.adminAnalytics.getAnalytics.queryOptions());
  }

  // User Dashboard Data Prefetching
  if (userRole === UserRole.USER) {
    prefetch(trpc.userRequests.getUserRequests.queryOptions({}));
  }

  // Driver Dashboard Data Prefetching
  if (userRole === UserRole.TRANSPORTATION_TEAM) {
    prefetch(trpc.driverRequests.getRequestStats.queryOptions());
  }

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
        {userRole === UserRole.ADMIN && <AdminDashboard />}
        <Suspense
          fallback={
            <LoadingState
              title="Dashboard Loading..."
              description="Please wait while we load your dashboard."
            />
          }
        >
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
