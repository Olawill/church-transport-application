import { OTPInputView } from "@/features/auth/components/two-factor-views";
import { requireTwoFactorPending } from "@/lib/session/server-session";

interface Props {
  searchParams: Promise<{
    twoFactorRedirect: string;
  }>;
}

const Verify2FA = async ({ searchParams }: Props) => {
  const { twoFactorRedirect } = await searchParams;

  if (!Boolean(twoFactorRedirect)) {
    await requireTwoFactorPending();
  }

  return <OTPInputView type="email" identifier="Testing" />;
};

export default Verify2FA;
