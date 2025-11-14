import { UserRole, UserStatus } from "@/generated/prisma";
import { prisma } from "../db";

export const extendUserSession = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      accounts: {
        select: {
          providerId: true,
          accessToken: true,
        },
      },
      addresses: {
        select: {
          id: true,
        },
        take: 1, // Just check if any address exists
      },
    },
  });

  if (!user) {
    return {
      status: UserStatus.PENDING,
      role: UserRole.USER,
      provider: "credential",
      accessToken: null,
      isOAuthSignup: false,
      needsCompletion: false,
    };
  }

  // Determine if this was an OAuth signup
  const isOAuthSignup = user.accounts[0]?.providerId !== "credential";

  // User needs completion if:
  // 1. They signed up via OAuth
  // 2. They don't have a phone number
  // 3. They don't have any addresses
  const needsCompletion =
    isOAuthSignup && (!user.phoneNumber || user.addresses.length === 0);

  return {
    status: user.status,
    role: user.role,
    provider: user.accounts[0]?.providerId || "credential",
    accessToken: user.accounts[0]?.accessToken || null,
    isOAuthSignup,
    needsCompletion,
  };
};
