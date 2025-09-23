import { auth } from "@/auth";
import { UserManagement } from "@/components/admin/user-management";
import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

const AdminUsersPage = async () => {
  const session = await auth();

  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return <UserManagement />;
};

export default AdminUsersPage;
