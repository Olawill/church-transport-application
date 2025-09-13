import { auth } from "@/auth";
import { NewRequestForm } from "@/components/requests/new-request-form";
import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

const NewRequestPage = async () => {
  const session = await auth();

  if (!session?.user || session.user.role !== UserRole.USER) {
    // if (!session) {
    redirect("/dashboard");
  }

  return <NewRequestForm />;
};

export default NewRequestPage;
