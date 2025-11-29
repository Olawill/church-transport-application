import { z } from "zod";

import { prisma } from "@/lib/db";

import { createTRPCRouter, sensitiveProcedure } from "@/trpc/init";

export const userRouter = createTRPCRouter({
  toggleSettings: sensitiveProcedure
    .input(
      z.object({
        field: z.enum([
          "emailNotifications",
          "smsNotifications",
          "whatsAppNotifications",
        ]),
        value: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { field, value } = input;

      const userId = ctx.auth.user.id;

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { [field]: value },
        // select: { [field]: true },
      });

      return {
        field,
        value: updated[field], // boolean
      };
    }),
});
