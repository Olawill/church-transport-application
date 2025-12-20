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
import { LockIcon } from "lucide-react";
import { redirect } from "next/navigation";

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
