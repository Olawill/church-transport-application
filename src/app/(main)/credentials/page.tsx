import { LockIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { requireAuth } from "@/lib/session/server-session";

export const metadata: Metadata = {
  title: "Credentials",
  description:
    "Manage your church credentials, by updating, deleting or adding new credentials to your ActsOnWheels account",
  openGraph: {
    title: "Credentials | ActsOnWheels",
    description: "Manage your church transportation account credentials",
  },
};

const CredentialsPage = async () => {
  const session = await requireAuth();

  const isAdminOrOwner =
    session.user.role === "ADMIN" || session.user.role === "OWNER";

  if (!isAdminOrOwner) {
    redirect("/dashboard");
  }

  return (
    <div className="my-auto min-h-screen w-full flex items-center">
      <Empty className="border border-dashed bg-sidebar backdrop-blur shadow-lg">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LockIcon />
          </EmptyMedia>
          <EmptyTitle className="text-2xl">Credentials</EmptyTitle>
          <EmptyDescription className="text-lg">
            This feature is coming soon. You’ll be able to manage your
            credentials here.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="lg" disabled>
            Coming Soon
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
};

export default CredentialsPage;
