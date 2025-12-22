import type { Metadata } from "next";

import { ResetPasswordView } from "@/features/auth/components/reset-password-view";
import { requireNoAuth } from "@/lib/session/server-session";

export const metadata: Metadata = {
  title: "Reset Password",
  description:
    "Reset your account password to access your ActsOnWheels account to manage your church transportation needs",
  openGraph: {
    title: "Reset Password | ActsOnWheels",
    description: "Access your church transportation account",
  },
};

const ResetPasswordPage = async () => {
  await requireNoAuth();

  // Main reset password form
  return <ResetPasswordView />;
};

export default ResetPasswordPage;
