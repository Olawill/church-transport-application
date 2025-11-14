import { redirect } from "next/navigation";

import { PendingApprovalView } from "@/features/auth/components/pending-approval-view";
import { getAuthSession } from "@/lib/session/server-session";

const PendingApprovalPage = async () => {
  const session = await getAuthSession();

  // No session - redirect to login
  if (!session) {
    redirect("/login");
  }

  // If user is approved, redirect to dashboard
  if (session.user.status === "APPROVED") {
    redirect("/dashboard");
  }

  // If user needs completion, redirect there
  if (session.user.needsCompletion) {
    redirect("/complete-profile");
  }

  return <PendingApprovalView />;
};

export default PendingApprovalPage;
