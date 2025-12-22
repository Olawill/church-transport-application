import { UserRole } from "@/generated/prisma/enums";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SearchParams } from "nuqs/server";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/screen-states/error-state";
import { ServiceManagement } from "@/features/admin/components/service-management";
import { servicesParamsLoader } from "@/features/admin/server/services/params-loader";
import { requireAuth } from "@/lib/session/server-session";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type Props = {
  searchParams: Promise<SearchParams>;
};

export const metadata: Metadata = {
  title: "Service Management",
  description:
    "Configure church service schedules and transportation availability",
  robots: {
    index: false,
    follow: false,
  },
};

const AdminServicesPage = async ({ searchParams }: Props) => {
  const session = await requireAuth();

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const params = await servicesParamsLoader(searchParams);

  prefetch(trpc.services.getPaginatedServices.queryOptions(params));

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Service Management Failed to Load"
            description="An error occurred while loading your services. Please try again or contact support if the issue continues."
          />
        }
      >
        <ServiceManagement />
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default AdminServicesPage;
