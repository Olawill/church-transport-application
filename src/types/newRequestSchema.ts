import { z } from "zod";

export const atLeastOneServiceTypeRefine = (
  data: { isPickUp: boolean; isDropOff: boolean },
  ctx: z.RefinementCtx
) => {
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
};

export const newRequestSchema = z
  .object({
    serviceDayId: z.string().min(1, "Service selection is required"),
    requestDate: z.preprocess(
      (val) => (val instanceof Date ? new Date(val) : undefined),
      z.date({ message: "Service date is required" }).refine(
        (date) => {
          const now = new Date();
          const today = new Date(now.toDateString()); // Strip time
          return date >= today;
        },
        {
          message: "Please select a valid date that is today or later",
        }
      )
    ),
    addressId: z.string().min(1, "Pickup address is required"),
    notes: z.string().optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
  })
  .superRefine(atLeastOneServiceTypeRefine);

export type NewRequestSchema = z.infer<typeof newRequestSchema>;

export const newAdminRequestSchema = z
  .object({
    userId: z.string().min(1, "User selection is required"),
    serviceDayId: z.string().min(1, "Service selection is required"),
    requestDate: z.preprocess(
      (val) => (val instanceof Date ? new Date(val) : undefined),
      z.date({ message: "Service date is required" }).refine(
        (date) => {
          const now = new Date();
          const today = new Date(now.toDateString()); // Strip time
          return date >= today;
        },
        {
          message: "Please select a valid date that is today or later",
        }
      )
    ),
    addressId: z.string().min(1, "Pickup address is required"),
    notes: z.string().optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
  })
  .superRefine(atLeastOneServiceTypeRefine);

export type NewAdminRequestSchema = z.infer<typeof newAdminRequestSchema>;
