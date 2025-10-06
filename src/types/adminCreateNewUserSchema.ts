import { BranchType } from "@/generated/prisma";
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidPostalCode,
} from "@/lib/utils";
import { z } from "zod";

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
    requestDate:
      // z
      // .preprocess(
      //   (val) => (val instanceof Date ? new Date(val) : undefined),
      z
        .date({ message: "Service date is required" })
        .refine(
          (date) => {
            const now = new Date();
            const today = new Date(now.toDateString()); // Strip time
            return date >= today;
          },
          {
            message: "Please select a valid date that is today or later",
          }
          // )
        )
        .optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
    isGroupRide: z.boolean(),
    numberOfGroup: z.number().int().min(2).max(10).nullable(),
  })
  .superRefine((data, ctx) => {
    // Validate password if login is required
    if (data.isLoginRequired) {
      if (!data.password || data.password.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Password is required when login is required",
          path: ["password"],
        });
      }
    }

    // Validate serviceDayId and requestDate if pickup request is created
    if (data.createPickUpRequest) {
      if (!data.serviceDayId || data.serviceDayId.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Service selection is required when creating pickup request",
          path: ["serviceDayId"],
        });
      }

      if (!data.requestDate) {
        ctx.addIssue({
          code: "custom",
          message: "Request date is required when creating pickup request",
          path: ["requestDate"],
        });
      }
      if (!data.isPickUp && !data.isDropOff) {
        ctx.addIssue({
          code: "custom",
          message: "Please select at least one option: Pickup or Drop-off",
          path: ["isPickUp"],
        });
        ctx.addIssue({
          code: "custom",
          message: "Please select at least one option: Pickup or Drop-off",
          path: ["isDropOff"],
        });
      }
    }

    // Group ride logic
    if (data.isGroupRide) {
      if (data.numberOfGroup == null) {
        ctx.addIssue({
          code: "custom",
          message: "Please enter number of people in group ride",
          path: ["numberOfGroup"],
        });
      } else if (data.numberOfGroup < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Group ride must include at least 2 people",
          path: ["numberOfGroup"],
        });
      } else if (data.numberOfGroup > 10) {
        ctx.addIssue({
          code: "custom",
          message: "Group ride must include at most 10 people",
          path: ["numberOfGroup"],
        });
      }
    } else {
      if (data.numberOfGroup !== null && data.numberOfGroup !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: "Number of people must be empty if not a group ride",
          path: ["numberOfGroup"],
        });
      }
    }
  });

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

export const churchBranchContactInfoUpdateSchema = z.object({
  branchName: z.string().nullable(),
  branchCategory: z.enum(BranchType),
  churchAddress: z.string().trim().min(1, "Church address is required"),
  churchCity: z.string().trim().min(1, "City is required"),
  churchProvince: z.string().min(1, "Province is required"),
  churchPostalCode: z
    .string()
    .trim()
    .min(1, "Postal code is required")
    .refine(isValidPostalCode, {
      message: "Please enter a valid Canadian postal code",
    }),
  churchCountry: z.string().trim().min(1, "Country is required"),
  churchPhone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(isValidPhoneNumber, {
      message: "Please enter a valid phone number",
    }),
  requestCutOffInHrs: z
    .string()
    .trim()
    .refine((val) => parseInt(val, 10), {
      message: "Please enter cut-off time in hours",
    }),
  defaultMaxDistance: z.enum(["10", "20", "30", "50"]),
});

export type ChurchBranchContactInfoUpdateSchema = z.infer<
  typeof churchBranchContactInfoUpdateSchema
>;
