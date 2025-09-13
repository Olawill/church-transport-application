import { auth } from "@/auth";
import { ServiceManagement } from "@/components/admin/service-management";
import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

const AdminServicesPage = async () => {
  const session = await auth();

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return <ServiceManagement />;
};

export default AdminServicesPage;
