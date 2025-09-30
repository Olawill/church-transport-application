import {
  isValidEmail,
  isValidPhoneNumber,
  isValidPostalCode,
} from "@/lib/utils";
import z from "zod";

export const newUserSchema = z
  .object({
    isLoginRequired: z.boolean(),
    createPickUpRequest: z.boolean(),

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
      .optional()
      .or(z.literal("")),

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

    serviceDayId: z
      .string()
      .min(1, "Service selection is required")
      .optional()
      .or(z.literal("")),
    requestDate: z
      .date()
      .refine(
        (date) => {
          const now = new Date();
          const today = new Date(now.toDateString());
          return date >= today;
        },
        {
          message: "Please select a valid date that is today or later",
        }
      )
      .optional(),
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
  )
  .refine(
    (data) => {
      // If pickup request is required, serviceId and requestDate must be provided
      if (data.createPickUpRequest) {
        return (
          data.serviceDayId &&
          data.requestDate !== undefined &&
          data.serviceDayId.trim().length > 0
        );
      }
      return true;
    },
    {
      message:
        "Service selection and Request Date is required when creating pickup request",
      path: ["serviceDayId"], // This will attach the error to the serviceDayId field
    }
  );

export type NewUserSchema = z.infer<typeof newUserSchema>;

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1, {
    message: "First name is required",
  }),
  lastName: z.string().trim().min(1, {
    message: "Last name is required",
  }),
  userName: z.string().trim().min(1, "Username is required").or(z.literal("")),
  email: z
    .email({
      message: "Email is required",
    })
    .refine(isValidEmail, { message: "Please enter a valid email address" }),
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
  image: z.string().optional().or(z.literal("")),
});

export type ProfileUpdateSchema = z.infer<typeof profileUpdateSchema>;

export const addressUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
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
  country: z.string().trim().min(1, "Country is required"),
});

export type AddressUpdateSchema = z.infer<typeof addressUpdateSchema>;

export const securityUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Password is required"),
    newPassword: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "New password and confirm password do not match",
  });

export type SecurityUpdateSchema = z.infer<typeof securityUpdateSchema>;
