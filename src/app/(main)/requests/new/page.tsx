import { UserRole } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/screen-states/error-state";
import { LoadingState } from "@/components/screen-states/loading-state";
import AdminNewUserRequest from "@/features/admin/components/admin-new-user-request";
import { NewRequestForm } from "@/features/requests/components/new-request-form";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const NewRequestPage = async () => {
  const session = await requireAuth();

  if (session.user.role === UserRole.TRANSPORTATION_TEAM) {
    redirect("/dashboard");
  }

  // Services
  prefetch(
    trpc.services.getServices.queryOptions({
      status: "active",
    })
  );

  if (session.user.role === "USER") {
    // User addresses
    prefetch(trpc.userAddresses.getUserAddresses.queryOptions());
  }

  // Users
  if (
    session.user.role === UserRole.ADMIN ||
    session.user.role === UserRole.OWNER
  ) {
    prefetch(trpc.users.getUsers.queryOptions({}));
  }

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="New Request Form Failed to Load"
            description="An error occurred while loading the request form. Please try again or contact support if the issue continues."
          />
        }
      >
        <Suspense
          fallback={
            <LoadingState
              title="New Request Form Loading..."
              description="Please wait while we load your form."
            />
          }
        >
          {session.user.role === UserRole.ADMIN ||
          session.user.role === UserRole.OWNER ? (
            <AdminNewUserRequest
              isNewUser={false}
              isGroupRequest={false}
              isRecurringRequest={false}
            />
          ) : (
            <NewRequestForm />
          )}
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default NewRequestPage;
