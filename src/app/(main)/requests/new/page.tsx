import { auth } from "@/auth";
import AdminNewUserRequest from "@/components/admin/admin-new-user-request";
import { NewRequestForm } from "@/components/requests/new-request-form";
import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

const NewRequestPage = async () => {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== UserRole.USER &&
      session.user.role !== UserRole.ADMIN)
  ) {
    // if (!session) {
    redirect("/dashboard");
  }

  return (
    <>
      {session.user.role === UserRole.ADMIN ? (
        <AdminNewUserRequest
          isNewUser={false}
          isGroupRequest={false}
          isRecurringRequest={false}
        />
      ) : (
        <NewRequestForm />
      )}
    </>
  );
};

export default NewRequestPage;
