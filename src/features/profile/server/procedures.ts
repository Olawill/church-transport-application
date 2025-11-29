import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { createTRPCRouter, sensitiveProcedure } from "@/trpc/init";
import { z } from "zod";

export const profileRouter = createTRPCRouter({
  toggle2FA: sensitiveProcedure
    .input(
      z.object({
        email: z.string(),
        value: z.boolean().optional(),
        twoFactorMethod: z.enum(["TOTP", "OTP"]).optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { email, value, twoFactorMethod } = input;

      const updateData: Prisma.UserUpdateInput = {};
      const user = await prisma.user.findUniqueOrThrow({
        where: { email },
        select: { twoFactorMethod: true },
      });

      if (
        user.twoFactorMethod === null ||
        user.twoFactorMethod !== twoFactorMethod
      ) {
        updateData["twoFactorMethod"] = twoFactorMethod;
      }

      if (value !== undefined) {
        updateData["twoFactorEnabled"] = value;
      }

      return prisma.user.update({
        where: { email },
        data: updateData,
        select: {
          twoFactorEnabled: true,
          twoFactorMethod: true,
          email: true,
        },
      });
    }),
});
