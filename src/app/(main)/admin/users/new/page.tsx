import { auth } from "@/auth";
import NewUserCreationForm from "@/components/admin/new-user-creation";
import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

const NewUserPage = async () => {
  const session = await auth();
  if (!session?.user || session?.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }
  return <NewUserCreationForm />;
};

export default NewUserPage;
