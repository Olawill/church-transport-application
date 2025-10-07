import { z } from "zod";

export const validateRequest = (
  data: {
    isPickUp: boolean;
    isDropOff: boolean;
    isGroupRide: boolean;
    numberOfGroup: number | null;
  },
  ctx: z.RefinementCtx
) => {
  const pickupDropoffMessage =
    "Please select at least one option: Pickup or Drop-off";

  if (!data.isPickUp && !data.isDropOff) {
    ctx.addIssue({
      code: "custom",
      message: pickupDropoffMessage,
      path: ["isPickUp"],
    });
    ctx.addIssue({
      code: "custom",
      message: pickupDropoffMessage,
      path: ["isDropOff"],
    });
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
};

export const newRequestSchema = z
  .object({
    serviceDayId: z.string().min(1, "Service selection is required"),
    requestDate: z.date({ message: "Service date is required" }).refine(
      (date) => {
        const now = new Date();
        const today = new Date(now.toDateString());
        return date >= today;
      },
      {
        message: "Please select a valid date that is today or later",
      }
    ),
    addressId: z.string().min(1, "Pickup address is required"),
    notes: z.string().optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
    isGroupRide: z.boolean(),
    numberOfGroup: z.number().int().min(2).max(10).nullable(),
  })
  .superRefine(validateRequest);

export type NewRequestSchema = z.infer<typeof newRequestSchema>;

export const newAdminRequestSchema = z
  .object({
    userId: z.string().min(1, "User selection is required"),
    serviceDayId: z.string().min(1, "Service selection is required"),
    requestDate: z.date({ message: "Service date is required" }).refine(
      (date) => {
        const now = new Date();
        const today = new Date(now.toDateString()); // Strip time
        return date >= today;
      },
      {
        message: "Please select a valid date that is today or later",
      }
      // )
    ),
    addressId: z.string().min(1, "Pickup address is required"),
    notes: z.string().optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
    isGroupRide: z.boolean(),
    numberOfGroup: z.number().int().min(2).max(10).nullable(),
  })
  .superRefine(validateRequest);

export type NewAdminRequestSchema = z.infer<typeof newAdminRequestSchema>;
