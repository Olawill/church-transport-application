import { LoginForm } from "@/features/auth/components/login-form";
import { requireNoAuth } from "@/lib/session/server-session";

const LoginPage = async () => {
  await requireNoAuth();

  return <LoginForm />;
};

export default LoginPage;
