import { auth } from "@/auth";
import { TransportationDashboard } from "@/components/dashboard/transportation-dashboard";
import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

const TransportationPage = async () => {
  const session = await auth();

  if (!session?.user || session.user.role !== UserRole.TRANSPORTATION_TEAM) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TransportationDashboard />
    </div>
  );
};

export default TransportationPage;
