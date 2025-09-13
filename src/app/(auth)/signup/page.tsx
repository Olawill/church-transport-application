import { auth } from "@/auth";
import { SignupForm } from "@/components/auth/signup-form";
import { redirect } from "next/navigation";

const SignupPage = async () => {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <SignupForm />;
};

export default SignupPage;
