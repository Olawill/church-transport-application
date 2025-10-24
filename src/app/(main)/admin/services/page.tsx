import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

import { ServiceManagement } from "@/features/admin/components/service-management";
import { getAuthSession } from "@/lib/session/server-session";

const AdminServicesPage = async () => {
  const session = await getAuthSession();

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return <ServiceManagement />;
};

export default AdminServicesPage;
