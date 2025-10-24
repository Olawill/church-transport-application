import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

import { NewRequestForm } from "@/components/requests/new-request-form";
import AdminNewUserRequest from "@/features/admin/components/admin-new-user-request";
import { getAuthSession } from "@/lib/session/server-session";

const NewRequestPage = async () => {
  const session = await getAuthSession();

  if (
    !session?.user ||
    (session.user.role !== UserRole.USER &&
      session.user.role !== UserRole.ADMIN)
  ) {
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
