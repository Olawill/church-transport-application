import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/screen-states/error-state";
import { RequestHistory } from "@/features/requests/components/request-history";
import { requestsParamsLoader } from "@/features/requests/server/params-loader";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Pickup Requests",
  description: "Manage your pickup requests for church services and events",
  openGraph: {
    title: "Pickup Requests | ActsOnWheels",
    description: "View and manage your transportation requests",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const RequestsPage = async ({ searchParams }: Props) => {
  await requireAuth();

  const params = await requestsParamsLoader(searchParams);

  prefetch(
    trpc.userRequests.getUserRequests.queryOptions({
      ...params,
      // maxDistance: "10",
    })
  );

  // Services
  prefetch(
    trpc.services.getServices.queryOptions({
      status: "active",
    })
  );

  // Users - just transportation team members
  prefetch(
    trpc.users.getUsers.queryOptions({
      role: "TRANSPORTATION_TEAM",
    })
  );

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Request History Failed to Load"
            description="An error occurred while loading the requests. Please try again or contact support if the issue continues."
          />
        }
      >
        <RequestHistory />
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default RequestsPage;
