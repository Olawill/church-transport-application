import { isValidEmail } from "@/lib/utils";
import { z } from "zod";

export const EmailTypes = [
  "welcome",
  "otp",
  "email_verification",
  "rejection_email",
  "appeal_request",
  "appeal_status",
  "forgot_password",
  "password_change",
  "2FA_confirm",
  "admin_user_creation",
  "driver_assignment",
  "driver_accept",
  "approval_need",
  "request_notify",
  "driver_notice",
] as const;

export const sendEmailSchema = z.object({
  to: z
    .email({
      message: "Email is required",
    })
    .refine(isValidEmail, { message: "Please enter a valid email address" }),
  type: z.enum(EmailTypes),
  name: z.string().min(1, "Name is required"),
  message: z.string().optional(),
  verifyLink: z.url().optional(),
  verifyCode: z.string().optional(),
  username: z.string().optional(),
  status: z.string().optional(),
});

export type SendEmailSchema = z.infer<typeof sendEmailSchema>;
