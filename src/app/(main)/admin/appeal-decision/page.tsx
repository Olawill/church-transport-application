import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SearchParams } from "nuqs/server";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/screen-states/error-state";
import { AppealDecisionView } from "@/features/appeal/components/admin/appeal-decision-view";
import { appealParamsLoader } from "@/features/appeal/params-loader";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Appeals Management",
  description: "Manage rejection appeals from users",
  openGraph: {
    title: "NAppeals Management | ActsOnWheels",
    description: "Manage rejection appeals from users",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const AppealDecision = async ({ searchParams }: Props) => {
  const session = await requireAuth();

  const userRole = session.user.role;

  if (!["ADMIN", "OWNER"].includes(userRole)) {
    redirect("/dashboard");
  }

  const { search, page, pageSize, status } =
    await appealParamsLoader(searchParams);

  prefetch(
    trpc.appeal.getAppealedUser.queryOptions({
      search,
      page,
      pageSize,
      status,
    })
  );

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Appeal Management Error"
            description="An error occurred while loading the appeal management page. Please try again or contact support if the issue continues."
          />
        }
      >
        <AppealDecisionView />
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default AppealDecision;
