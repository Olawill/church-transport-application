import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { SearchParams } from "nuqs/server";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/screen-states/error-state";
import { TransportationDashboard } from "@/features/dashboard/components/transportation-dashboard";
import { requestsTransportParamsLoader } from "@/features/requests/server/params-loader";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

const TransportationPage = async ({ searchParams }: Props) => {
  const session = await requireAuth();

  if (!session?.user || session.user.role !== UserRole.TRANSPORTATION_TEAM) {
    redirect("/dashboard");
  }

  const params = await requestsTransportParamsLoader(searchParams);

  prefetch(
    trpc.userRequests.getUserRequests.queryOptions({
      ...params,
    })
  );

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Transportation Dashboard Failed to Load"
            description="An error occurred while loading your dashboard. Please try again or contact support if the issue continues."
          />
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TransportationDashboard />
        </div>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default TransportationPage;
