import { auth } from "@/auth";
import { RequestHistory } from "@/components/requests/request-history";
import { redirect } from "next/navigation";

const RequestsPage = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <RequestHistory />;
};

export default RequestsPage;
