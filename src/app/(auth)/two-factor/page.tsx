import { OTPInputView } from "@/features/auth/components/two-factor-views";
import { requireTwoFactorPending } from "@/lib/session/server-session";

interface Props {
  searchParams: Promise<{
    twoFactorRedirect: string;
    type: "email" | "phone" | "whatsapp";
  }>;
}

const Verify2FA = async ({ searchParams }: Props) => {
  const { twoFactorRedirect, type } = await searchParams;

  if (!Boolean(twoFactorRedirect)) {
    await requireTwoFactorPending();
  }

  return <OTPInputView type={type} />;
};

export default Verify2FA;
