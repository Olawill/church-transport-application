import { ErrorState } from "@/components/screen-states/error-state";
import { ProfileManagement } from "@/features/profile/components/profile-management";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { ErrorBoundary } from "react-error-boundary";

const ProfilePage = async () => {
  const session = await requireAuth();

  // const isAdminOrOwner =
  //   session.user.role === "ADMIN" || session.user.role === "OWNER";

  prefetch(trpc.userProfile.getUserProfile.queryOptions());
  prefetch(trpc.userAddresses.getUserAddresses.queryOptions());

  prefetch(trpc.places.countries.queryOptions());

  // if (isAdminOrOwner) {
  //   prefetch(trpc.organization.getOrganizationData.queryOptions({}));
  // }

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Profile Failed to Load"
            description="An error occurred while loading your profile. Please try again or contact support if the issue continues."
          />
        }
      >
        <ProfileManagement />
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default ProfilePage;
