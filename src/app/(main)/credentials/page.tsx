import { requireAuth } from "@/lib/session/server-session";
import { redirect } from "next/navigation";

const CredentialsPage = async () => {
  const session = await requireAuth();

  const isAdminOrOwner =
    session.user.role === "ADMIN" || session.user.role === "OWNER";

  if (!isAdminOrOwner) {
    redirect("/dashboard");
  }

  return <div>CredentialsPage</div>;
};

export default CredentialsPage;
