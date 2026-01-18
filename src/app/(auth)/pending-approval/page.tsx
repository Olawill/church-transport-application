import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PendingApprovalView } from "@/features/auth/components/pending-approval-view";
import { getAuthSession } from "@/lib/session/server-session";

export const metadata: Metadata = {
  title: "Account Pending Approval | ActsOnWheels",
  description:
    "Your ActsOnWheels account is currently pending approval. Once approved, you'll be able to access your account and manage your church transportation needs.",
  openGraph: {
    title: "Account Pending Approval | ActsOnWheels",
    description:
      "Your ActsOnWheels account is pending approval. You'll gain full access once your account has been approved.",
  },
};

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

  // If user's profile is not complete
  if (session.user.needsCompletion) {
    redirect("/complete-profile");
  }

  return <PendingApprovalView />;
};

export default PendingApprovalPage;
