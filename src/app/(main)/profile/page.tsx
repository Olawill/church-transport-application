import { redirect } from "next/navigation";

import { ProfileManagement } from "@/components/profile/profile-management";
import { getAuthSession } from "@/lib/session/server-session";

const ProfilePage = async () => {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  return <ProfileManagement />;
};

export default ProfilePage;
