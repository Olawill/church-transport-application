import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

import NewUserCreationForm from "@/features/admin/components/new-user-creation";
import { getAuthSession } from "@/lib/session/server-session";

const NewUserPage = async () => {
  const session = await getAuthSession();

  if (!session?.user || session?.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }
  return <NewUserCreationForm />;
};

export default NewUserPage;
