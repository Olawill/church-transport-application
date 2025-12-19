import { sendEmailSchema } from "../emailSchema";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { sendMail } from "@/features/email/actions/sendEmail";

export const sendMailRouter = createTRPCRouter({
  sendMail: protectedProcedure
    .input(sendEmailSchema)
    .mutation(async ({ input }) => {
      const { to, type, name, message, verifyCode, verifyLink } = input;

      const { success, error } = await sendMail({
        to,
        type,
        name,
        message,
        verifyCode,
        verifyLink,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error || "Failed to send email",
        });
      }

      return { success };
    }),
});
