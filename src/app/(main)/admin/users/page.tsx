import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

import { UserManagement } from "@/features/admin/components/user-management";
import { getAuthSession } from "@/lib/session/server-session";

const AdminUsersPage = async () => {
  const session = await getAuthSession();

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return <UserManagement />;
};

export default AdminUsersPage;
