import { UserRole } from "@/generated/prisma/enums";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/screen-states/error-state";
import { LoadingState } from "@/components/screen-states/loading-state";
import { NewUserCreationForm } from "@/features/admin/components/new-user-creation";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Admin User Management",
  description: "Admin can manage user accounts, roles, and permissions",
  robots: {
    index: false,
    follow: false,
  },
};

const NewUserPage = async () => {
  const session = await requireAuth();

  if (!session?.user || session?.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  prefetch(trpc.places.countries.queryOptions());

  prefetch(
    trpc.services.getServices.queryOptions({
      status: "active",
    })
  );

  prefetch(trpc.users.getUsers.queryOptions({}));

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="New User Form Failed to Load"
            description="An error occurred while loading new users form. Please try again or contact support if the issue continues."
          />
        }
      >
        <Suspense
          fallback={
            <LoadingState
              title="New User Form Loading..."
              description="Please wait while we load your form."
            />
          }
        >
          <NewUserCreationForm />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default NewUserPage;
