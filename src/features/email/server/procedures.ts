import { sendEmailSchema } from "../emailSchema";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { sendMail } from "@/features/email/actions/sendEmail";

export const sendMailRouter = createTRPCRouter({
  sendMail: protectedProcedure
    .input(sendEmailSchema)
    .mutation(async ({ input }) => {
      const { to, type, name, message, verifyCode, verifyLink } = input;

      const { success, errors, error } = await sendMail({
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

      if (errors) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: errors.join(", ") || "Validation error",
        });
      }

      return { success };
    }),
});
