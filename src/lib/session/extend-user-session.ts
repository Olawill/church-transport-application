import { UserRole, UserStatus } from "@/generated/prisma";
import { prisma } from "../db";

export const extendUserSession = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return {
      status: UserStatus.PENDING,
      role: UserRole.USER,
    };
  }

  return { status: user.status, role: user.role };
};
