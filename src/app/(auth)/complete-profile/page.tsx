import { redirect } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/screen-states/error-state";
import { OauthCompletionModal } from "@/features/auth/components/oauth-completion-modal";
import { getAuthSession } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

const OauthProfileCompletionPage = async () => {
  const session = await getAuthSession();

  // No session - redirect to login
  if (!session) {
    redirect("/login");
  }

  // If user doesn't need completion, redirect based on status
  if (!session.user.needsCompletion) {
    if (session.user.status === "PENDING") {
      redirect("/login?error=pending_approval");
    } else {
      redirect("/dashboard");
    }
  }

  prefetch(trpc.places.countries.queryOptions());

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Profile Completion Form Failed"
            description="An error occurred while loading profile completion form. Please try again or contact support if the issue continues."
          />
        }
      >
        <OauthCompletionModal />
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default OauthProfileCompletionPage;
