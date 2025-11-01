import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { SearchParams } from "nuqs/server";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/screen-states/error-state";
import { UserManagement } from "@/features/admin/components/user-management";
import { usersParamsLoader } from "@/features/users/params-loader";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

const AdminUsersPage = async ({ searchParams }: Props) => {
  const session = await requireAuth();

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const params = await usersParamsLoader(searchParams);

  prefetch(trpc.users.getPaginatedUsers.queryOptions(params));

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="User Management Board Failed to Load"
            description="An error occurred while loading users. Please try again or contact support if the issue continues."
          />
        }
      >
        <UserManagement />
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default AdminUsersPage;
