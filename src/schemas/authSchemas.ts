import { PASSWORD_LENGTH } from "@/config/constants";
import { passwordStrength } from "@/features/auth/lib/utils";
import {
  getPostalCodeValidationMessage,
  isValidEmail,
  isValidPhoneNumber,
  isValidPostalCode,
} from "@/lib/utils";
import z from "zod";
import { addressUpdateSchema } from "./adminCreateNewUserSchema";

export const userAppealSchema = z.object({
  reason: z.string().min(1, {
    message: "Your reason for appeal is required",
  }),
  additionalInfo: z.string().optional(),
});

export type UserAppealValues = z.infer<typeof userAppealSchema>;

export const passwordResetSchema = z.object({
  email: z.email({
    message: "Email is required",
  }),
});

export type PasswordResetValues = z.infer<typeof passwordResetSchema>;

export const twoFactorToggleSchema = z.object({
  password: z.string().min(1, {
    message: "Password is required for authentication",
  }),
});

export type TwoFactorToggleValues = z.infer<typeof twoFactorToggleSchema>;

export const twoFactorFirstTimeToggleSchema = z.object({
  password: z.string().min(1, {
    message: "Password is required for authentication",
  }),
  type: z.enum(["TOTP", "OTP"]),
});

export type TwoFactorFirstTimeToggleValues = z.infer<
  typeof twoFactorFirstTimeToggleSchema
>;

export const twoFactorTypeSchema = z.object({
  type: z.enum(["TOTP", "OTP"]),
});

export type TwoFactorTypeValues = z.infer<typeof twoFactorTypeSchema>;

export const otpSchema = z.object({
  code: z.string().min(6, {
    message: "OTP code is required",
  }),
});

export type OtpValues = z.infer<typeof otpSchema>;

export const whatsAppNotificationSchema = z.object({
  whatsappNumber: z
    .string({ message: "WhatsApp number is required" })
    .trim()
    .min(1, "WhatsApp number is required")
    .refine(isValidPhoneNumber, {
      message: "Please enter a valid phone number",
    }),
});

export type WhatsAppNotificationSchema = z.infer<
  typeof whatsAppNotificationSchema
>;

export const loginSchema = passwordResetSchema.extend({
  password: z.string().min(1, {
    message: "Password is required for authentication",
  }),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, {
      message: "First name is required",
    }),
    lastName: z.string().trim().min(1, {
      message: "Last name is required",
    }),
    email: z
      .email({
        message: "Email is required",
      })
      .refine(isValidEmail, { message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(1, "Password is required")
      .min(PASSWORD_LENGTH, "Password must be at least 8 characters")
      .refine(
        (val) => {
          const level = passwordStrength(val).strength;
          return level !== "weak";
        },
        {
          message: "Password is too weak",
        }
      ),
    confirmPassword: z.string().min(1, "Confirm password is required"),

    phoneNumber: z
      .string({ message: "Phone number is required" })
      .trim()
      .min(1, "Phone number is required")
      .refine(isValidPhoneNumber, {
        message: "Please enter a valid phone number",
      }),
    whatsappNumber: z
      .string()
      .optional()
      .refine((val) => !val || isValidPhoneNumber(val), {
        message: "Please enter a valid WhatsApp number",
      }),
    street: z.string().trim().min(1, "Street address is required"),

    city: z.string().trim().min(1, "City is required"),

    province: z.string().min(1, "Province is required"),

    postalCode: z
      .string()
      .min(3, "Postal code must be at least 3 characters")
      .max(10, "Postal code must be at most 10 characters"),

    country: z.string().min(1, "Country is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .superRefine((data, ctx) => {
    // Allow validation to pass if country is not selected yet
    if (!data.country) return;

    // Validate postal code
    const isValid = isValidPostalCode(data.postalCode, data.country);

    if (!isValid) {
      ctx.addIssue({
        code: "custom",
        message: getPostalCodeValidationMessage(data.postalCode, data.country),
        path: ["postalCode"],
      });
    }
  });

export type SignupSchema = z.infer<typeof signupSchema>;

export const profileContactSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(isValidPhoneNumber, {
      message: "Please enter a valid phone number",
    }),
  whatsappNumber: z
    .string()
    .trim()
    .refine(isValidPhoneNumber, {
      message: "Please enter a valid whatsApp number",
    })
    .optional()
    .or(z.literal("")),
});
export type ProfileContactSchema = z.infer<typeof profileContactSchema>;

export const profileAddressSchema = addressUpdateSchema;
export type ProfileAddressSchema = z.infer<typeof profileAddressSchema>;

export const resetPasswordSchema = signupSchema.pick({
  password: true,
  confirmPassword: true,
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
