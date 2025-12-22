import type { Metadata } from "next";

import { OTPInputView } from "@/features/auth/components/two-factor-views";
import { requireTwoFactorPending } from "@/lib/session/server-session";

interface Props {
  searchParams: Promise<{
    twoFactorRedirect: string;
    type: "email" | "phone" | "whatsapp";
  }>;
}

export const metadata: Metadata = {
  title: "Verify Two-Factor",
  description:
    "Verify your Two-Factor Authentication to access your ActsOnWheels account to manage your church transportation needs",
  openGraph: {
    title: "Verify Two-Factor | ActsOnWheels",
    description: "Access your church transportation account",
  },
};

const Verify2FA = async ({ searchParams }: Props) => {
  const { twoFactorRedirect, type } = await searchParams;

  if (!Boolean(twoFactorRedirect)) {
    await requireTwoFactorPending();
  }

  return <OTPInputView type={type} />;
};

export default Verify2FA;
