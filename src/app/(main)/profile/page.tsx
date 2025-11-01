import { ErrorState } from "@/components/screen-states/error-state";
import { ProfileManagement } from "@/features/profile/components/profile-management";
import { ProfileManagementSkeleton } from "@/features/profile/components/profile-management-skeleton";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

const ProfilePage = async () => {
  const session = await requireAuth();

  const isAdminOrOwner =
    session.user.role === "ADMIN" || session.user.role === "OWNER";

  prefetch(trpc.userProfile.getUserProfile.queryOptions());
  prefetch(trpc.userAddresses.getUserAddresses.queryOptions());

  prefetch(trpc.places.countries.queryOptions());

  if (isAdminOrOwner) {
    prefetch(trpc.organization.getOrganizationData.queryOptions({}));
  }

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
            <ProfileManagementSkeleton isAdminOrOwner={isAdminOrOwner} />
          }
        >
          <ProfileManagement />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default ProfilePage;
