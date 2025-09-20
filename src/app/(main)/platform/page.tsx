"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { UserRole } from "@/generated/prisma";

import { PlatformAdminDashboard } from "@/components/platform/platform-admin-dashboard";

const platformRoles: UserRole[] = [
  UserRole.PLATFORM_ADMIN,
  UserRole.PLATFORM_USER,
];

const PlatformPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (!platformRoles.includes(session.user.role)) {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full size-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!session?.user || !platformRoles.includes(session.user.role)) {
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

  return <PlatformAdminDashboard />;
};

export default PlatformPage;
