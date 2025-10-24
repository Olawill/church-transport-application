import { redirect } from "next/navigation";

import { RequestHistory } from "@/components/requests/request-history";
import { getAuthSession } from "@/lib/session/server-session";

const RequestsPage = async () => {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <RequestHistory />;
};

export default RequestsPage;
