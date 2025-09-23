"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { UserRole } from "@/generated/prisma";

import { RouteOptimizer } from "@/components/route-optimization/route-optimizer";

const ableToAccessRouteRoles: UserRole[] = [
  UserRole.ADMIN,
  UserRole.TRANSPORTATION_TEAM,
];

const RoutesPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Only admins and transportation team can access routes
    if (!ableToAccessRouteRoles.includes(session.user.role)) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!session?.user || !ableToAccessRouteRoles.includes(session.user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <RouteOptimizer />;
};

export default RoutesPage;
