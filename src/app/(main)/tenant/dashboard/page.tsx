import { auth } from "@/auth";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TransportationTeamDashboard } from "@/components/dashboard/transportation-dashboard";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { UserRole } from "@/generated/prisma";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  const session = await auth();

  if (!session?.user) return null;

  const userRole = session.user.role;

  if (userRole === UserRole.ADMIN) {
    return <AdminDashboard />;
  }

  if (userRole === UserRole.TRANSPORTATION_TEAM) {
    return <TransportationTeamDashboard />;
  }
  return <UserDashboard />;
};

export default DashboardPage;
