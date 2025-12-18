import { BackupCodeView } from "@/features/auth/components/two-factor-views";
import { requireTwoFactorPending } from "@/lib/session/server-session";

const BackupCodePage = async () => {
  await requireTwoFactorPending();

  return <BackupCodeView />;
};

export default BackupCodePage;
