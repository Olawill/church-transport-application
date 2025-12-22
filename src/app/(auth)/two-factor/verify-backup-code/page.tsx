import type { Metadata } from "next";

import { BackupCodeView } from "@/features/auth/components/two-factor-views";
import { requireTwoFactorPending } from "@/lib/session/server-session";

export const metadata: Metadata = {
  title: "Verify Backup Code",
  description:
    "Verify your account using Backup Code to access your ActsOnWheels account to manage your church transportation needs",
  openGraph: {
    title: "Verify Backup Code | ActsOnWheels",
    description: "Access your church transportation account",
  },
};

const BackupCodePage = async () => {
  await requireTwoFactorPending();

  return <BackupCodeView />;
};

export default BackupCodePage;
