import { UserRole, UserStatus } from "@/generated/prisma/client";
import { prisma } from "../db";

export const extendUserSession = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: {
        select: {
          providerId: true,
        },
      },
      addresses: {
        select: {
          id: true,
        },
        take: 1, // just check if any address exists
      },
    },
  });

  if (!user) {
    return {
      status: UserStatus.PENDING,
      role: UserRole.USER,
      provider: "credential",
      isOauthSignup: false,
      needsCompletion: false,
      otpChoice: null,
      firstTimeLogin: true,
    };
  }

  // Determine if this was an Oauth signup
  const isOauthSignup = user.accounts[0]?.providerId !== "credential";

  /**
   * User registration needs completion if:
   * 1. They signed up via OAuth
   * 2. The don't have a phone number
   * 3. They don't have any address
   */
  const needsCompletion =
    isOauthSignup && (!user.phoneNumber || user.addresses.length === 0);

  return {
    status: user.status,
    role: user.role,
    provider: user.accounts[0].providerId || "credential",
    isOauthSignup,
    needsCompletion,
    otpChoice: user.twoFactorMethod,
    firstTimeLogin: user.firstLoginAt === null,
  };
};
