import { differenceInWeeks } from "date-fns/differenceInWeeks";
import { differenceInMonths } from "date-fns/differenceInMonths";
import { z } from "zod";
import { validateRequestDate } from "@/actions/validRequestDate";

export const validateRequest = async (
  data: {
    isPickUp: boolean;
    isDropOff: boolean;
    isGroupRide: boolean;
    numberOfGroup: number | null;
    isRecurring: boolean;
    endDate?: Date;
    serviceDayId: string;
    requestDate: Date;
  },
  ctx: z.RefinementCtx
) => {
  const result = await validateRequestDate(data.requestDate, data.serviceDayId);

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

  // Recurring request logic
  if (data.isRecurring) {
    const startDate = data.requestDate ?? new Date();
    startDate.setHours(0, 0, 0, 0);

    if (!data.endDate) {
      ctx.addIssue({
        code: "custom",
        message: "Please select the end date for the recurring request",
        path: ["endDate"],
      });
      return;
    }
    data.endDate.setHours(0, 0, 0, 0);

    const durationPeriodInWeeks = differenceInWeeks(data.endDate, startDate);

    const durationPeriodInMonths = differenceInMonths(data.endDate, startDate);

    if (durationPeriodInWeeks < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Please select the end date that is greater than a week",
        path: ["endDate"],
      });
    }

    if (durationPeriodInMonths > 3) {
      ctx.addIssue({
        code: "custom",
        message: "Please select an end date at least 3 months away",
        path: ["endDate"],
      });
    }
  } else {
    if (data.endDate !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Recurring Ride End Date is not required",
        path: ["endDate"],
      });
    }
  }

  // Ensure request falls on day of week
  if (result.error) {
    ctx.addIssue({
      code: "custom",
      message: result.message,
      path: ["requestDate"],
    });
  } else {
    const { isServiceDayOfWeek, dayOfWeek } = result.validData;

    if (!isServiceDayOfWeek) {
      ctx.addIssue({
        code: "custom",
        message: `Request date for this service should be ${dayOfWeek}`,
        path: ["requestDate"],
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
    isRecurring: z.boolean(),
    endDate: z.date().optional(),
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
    isRecurring: z.boolean(),
    endDate: z.date().optional(),
  })
  .superRefine(validateRequest);

export type NewAdminRequestSchema = z.infer<typeof newAdminRequestSchema>;
