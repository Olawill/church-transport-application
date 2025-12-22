import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";
import { requireNoAuth } from "@/lib/session/server-session";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Sign in to your ActsOnWheels account to manage your church transportation needs",
  openGraph: {
    title: "Login | ActsOnWheels",
    description: "Access your church transportation account",
  },
};

const LoginPage = async () => {
  await requireNoAuth();

  return <LoginForm />;
};

export default LoginPage;
