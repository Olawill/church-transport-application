import { passwordStrength } from "@/features/auth/lib/utils";
import {
  getPostalCodeValidationMessage,
  isValidEmail,
  isValidPhoneNumber,
  isValidPostalCode,
} from "@/lib/utils";
import z from "zod";
import { addressUpdateSchema } from "./adminCreateNewUserSchema";

export const loginSchema = z.object({
  email: z.email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required for authentication",
  }),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const PASSWORD_LENGTH = 8;

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
      .refine((val) => passwordStrength(val).strength === "weak", {
        message: "Password is too weak",
      }),
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

    country: z.string().min(1, "Province is required"),
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
