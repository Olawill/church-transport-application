import {
  isValidEmail,
  isValidPhoneNumber,
  isValidPostalCode,
} from "@/lib/utils";
import z from "zod";
import { addressUpdateSchema } from "./newUserSchema";

export const loginSchema = z.object({
  email: z.email({
    message: "Email is required",
  }),
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
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),

    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .refine(isValidPhoneNumber, {
        message: "Please enter a valid phone number",
      }),
    street: z.string().trim().min(1, "Street address is required"),

    city: z.string().trim().min(1, "City is required"),

    province: z.string().min(1, "Province is required"),

    postalCode: z
      .string()
      .trim()
      .min(1, "Postal code is required")
      .refine(isValidPostalCode, {
        message: "Please enter a valid Canadian postal code",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
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
