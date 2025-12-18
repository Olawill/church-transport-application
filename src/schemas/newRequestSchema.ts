import { validateRequestDate } from "@/actions/validRequestDate";
import { differenceInMonths, differenceInWeeks } from "date-fns";
import { z } from "zod";

export const validateRequest = async (
  data: {
    isPickUp: boolean;
    isDropOff: boolean;
    isGroupRide: boolean;
    numberOfGroup: number | null;
    isRecurring: boolean;
    endDate?: Date | string;
    serviceDayId: string;
    requestDate: Date | string;
  },
  ctx: z.RefinementCtx
) => {
  const requestDate =
    typeof data.requestDate === "string"
      ? new Date(data.requestDate)
      : data.requestDate;
  const endDate =
    typeof data.endDate === "string" ? new Date(data.endDate) : data.endDate;

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
    const startDate = requestDate ?? new Date();
    startDate.setHours(0, 0, 0, 0);

    if (!endDate) {
      ctx.addIssue({
        code: "custom",
        message: "Please select the end date for the recurring request",
        path: ["endDate"],
      });
      return;
    }
    endDate.setHours(0, 0, 0, 0);

    const durationPeriodInWeeks = differenceInWeeks(endDate, startDate);

    const durationPeriodInMonths = differenceInMonths(endDate, startDate);

    if (durationPeriodInWeeks < 2) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be at least 2 weeks after the start date",
        path: ["endDate"],
      });
    }

    if (durationPeriodInMonths > 3) {
      ctx.addIssue({
        code: "custom",
        message: "Recurring period must not exceed 3 months.",
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
};

export const serverValidateRequest = async (
  data: {
    isPickUp: boolean;
    isDropOff: boolean;
    isGroupRide: boolean;
    numberOfGroup: number | null;
    isRecurring: boolean;
    endDate?: Date | string;
    serviceDayId: string;
    serviceDayOfWeek?: string;
    requestDate: Date | string;
  },
  ctx: z.RefinementCtx
) => {
  const requestDate =
    typeof data.requestDate === "string"
      ? new Date(data.requestDate)
      : data.requestDate;
  const endDate =
    typeof data.endDate === "string" ? new Date(data.endDate) : data.endDate;

  if (!data.serviceDayOfWeek) {
    ctx.addIssue({
      code: "custom",
      message: "Service day of week is required for validation",
      path: ["serviceDayOfWeek"],
    });
    return;
  }

  const parts = data.serviceDayOfWeek.split("-");
  const dayOfWeek = Number(parts[0]);

  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid day of week format",
      path: ["serviceDayOfWeek"],
    });
    return;
  }

  const result = await validateRequestDate(dayOfWeek, data.serviceDayId);

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
    const startDate = requestDate ?? new Date();
    startDate.setHours(0, 0, 0, 0);

    if (!endDate) {
      ctx.addIssue({
        code: "custom",
        message: "Please select the end date for the recurring request",
        path: ["endDate"],
      });
      return;
    }
    endDate.setHours(0, 0, 0, 0);

    const durationPeriodInWeeks = differenceInWeeks(endDate, startDate);

    const durationPeriodInMonths = differenceInMonths(endDate, startDate);

    if (durationPeriodInWeeks < 2) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be at least 2 weeks after the start date",
        path: ["endDate"],
      });
    }

    if (durationPeriodInMonths > 3) {
      ctx.addIssue({
        code: "custom",
        message: "Recurring period must not exceed 3 months.",
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
    serviceDayOfWeek: z.string().optional(), // For multi-day services
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
    serviceDayOfWeek: z.string().optional(), // For multi-day services
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

export const adminPayloadSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.email(),
    phone: z.string().optional().nullable(),
    isLoginRequired: z.boolean(),
    password: z.string().optional(),
    street: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1, "Country is required"),
    serviceDayId: z.string().min(1),
    serviceDayOfWeek: z.string().min(1),
    requestDate: z.date(),
    notes: z.string().optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
    isGroupRide: z.boolean(),
    numberOfGroup: z.number().int().min(2).max(10).nullable(),
    isRecurring: z.boolean(),
    endDate: z.date().optional(),
    createPickUpRequest: z.boolean(),
  })
  .superRefine(serverValidateRequest);

export const userPayloadSchema = z
  .object({
    userId: z.string().optional(),
    requestId: z.string().optional(),
    serviceDayId: z.string().min(1),
    serviceDayOfWeek: z.string().optional(),
    addressId: z.string(),
    requestDate: z.date(),
    notes: z.string().optional(),
    isPickUp: z.boolean(),
    isDropOff: z.boolean(),
    isGroupRide: z.boolean(),
    numberOfGroup: z.number().int().min(2).max(10).nullable(),
    isRecurring: z.boolean(),
    updateSeries: z.boolean().optional(),
    endDate: z.date().optional(),
  })
  .superRefine(serverValidateRequest);
