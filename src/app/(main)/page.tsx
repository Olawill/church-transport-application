import { requireAuth } from "@/lib/session/server-session";
import { redirect } from "next/navigation";

const Home = async () => {
  const session = await requireAuth();

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
};

export default Home;
