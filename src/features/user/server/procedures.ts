import { z } from "zod";

import { prisma } from "@/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  toggleSettings: protectedProcedure
    .input(
      z.object({
        field: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { field, value } = input;

      const userId = ctx.auth.user.id;

      // Valid boolean fields on User
      const userFields = [
        "twoFactorEnabled",
        "emailNotifications",
        "smsNotifications",
        "whatsAppNotifications",
      ];

      let result;
      if (userFields.includes(field)) {
        result = await prisma.user.update({
          where: { id: userId },
          data: { [field]: value },
          select: { [field]: true },
        });
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid field",
        });
      }

      return result;
    }),
});
