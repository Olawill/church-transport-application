import {
  isValidEmail,
  isValidPhoneNumber,
  isValidPostalCode,
} from "@/lib/utils";
import z from "zod";

export const newUserSchema = z
  .object({
    isLoginRequired: z.boolean(),
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
      .min(8, "Password must be at least 8 characters")
      .optional(),

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
  .refine(
    (data) => {
      // If login is required, password must be provided and not empty
      if (data.isLoginRequired) {
        return data.password && data.password.trim().length > 0;
      }

      return true; // If login not required, password validation passes
    },
    {
      message: "Password is required when login is required",
      path: ["password"], // This will attach the error to the password field
    }
  );

export type NewUserSchema = z.infer<typeof newUserSchema>;
