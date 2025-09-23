import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ProfileManagement } from "@/components/profile/profile-management";

const ProfilePage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <ProfileManagement />;
};

export default ProfilePage;
