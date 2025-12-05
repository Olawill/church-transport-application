import { requireNoAuth } from "@/lib/session/server-session";
import { ResetPasswordView } from "@/features/auth/components/reset-password-view";

const ResetPasswordPage = async () => {
  await requireNoAuth();

  // Main reset password form
  return <ResetPasswordView />;
};

export default ResetPasswordPage;
