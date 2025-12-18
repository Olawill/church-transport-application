import { getAuthSession } from "@/lib/session/server-session";
import { redirect } from "next/navigation";

const Home = async () => {
  const session = await getAuthSession();

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
};

export default Home;
