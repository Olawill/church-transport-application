import { ErrorState } from "@/components/screen-states/error-state";
import { AppealDecisionView } from "@/features/appeal/components/admin/appeal-decision-view";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import { SearchParams } from "nuqs/server";
import { appealParamsLoader } from "@/features/appeal/params-loader";

type Props = {
  searchParams: Promise<SearchParams>;
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
