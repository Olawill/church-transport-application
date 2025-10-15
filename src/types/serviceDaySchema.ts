import {
  Frequency,
  Ordinal,
  ServiceCategory,
  ServiceType,
} from "@/generated/prisma";
import z from "zod";

// Base schema with common fields
const baseSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  time: z.string().min(1, "Service time is required"),
  isActive: z.boolean().optional(),
});

// Single day schema
const singleDaySchema = baseSchema.extend({
  dayOfWeek: z.string().min(1, "Please select a valid day of the week"),
});

// Multiple days schema
const multipleDaysSchema = baseSchema.extend({
  dayOfWeek: z
    .array(z.string())
    .min(1, "Please select at least one day of the week"),
});

// RECURRING schema
export const recurringSchema = singleDaySchema.extend({
  serviceCategory: z.literal(ServiceCategory.RECURRING),
  serviceType: z.literal(ServiceType.REGULAR),
  frequency: z.enum(Frequency),
  ordinal: z.enum(Ordinal),
  startDate: z.date().optional(),
});

// ONETIME_ONEDAY schema
export const onetimeOneDaySchema = singleDaySchema.extend({
  serviceCategory: z.literal(ServiceCategory.ONETIME_ONEDAY),
  serviceType: z.literal(ServiceType.SPECIAL),
  startDate: z.date({
    message: "Start date is required for this service type",
  }),
});

// ONETIME_MULTIDAY schema
export const onetimeMultiDaySchema = multipleDaysSchema
  .extend({
    serviceCategory: z.literal(ServiceCategory.ONETIME_MULTIDAY),
    serviceType: z.literal(ServiceType.SPECIAL),
    startDate: z.date({
      message: "Start date is required for this service type",
    }),
    endDate: z.date().optional(),
    cycle: z
      .number()
      .int()
      .positive({ message: "Frequency cycle must be a positive number" })
      .optional(),
    frequency: z.enum(Frequency),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine((data) => data.endDate || data.cycle, {
    message: "Either end date or frequency cycle is required",
    path: ["endDate"],
  });

// FREQUENT_MULTIDAY schema
export const frequentMultiDaySchema = multipleDaysSchema.extend({
  serviceCategory: z.literal(ServiceCategory.FREQUENT_MULTIDAY),
  serviceType: z.literal(ServiceType.SPECIAL),
  startDate: z.date({
    message: "Start date is required for this service type",
  }),
  cycle: z.number({ message: "Frequency cycle is required" }).int().positive({
    message: "Frequency cycle must be a positive number",
  }),
  frequency: z.enum(Frequency),
  ordinal: z.enum(Ordinal),
});

// export const serviceDaySchema = z
//   .object({
//     name: z.string().min(1, "Service name is required"),
//     dayOfWeek: z.string().min(1, "Please select a valid day of the week"),
//     time: z.string().min(1, "Service time is required"),
//     isActive: z.boolean().optional(),
//     serviceType: z
//       .enum(ServiceType, {
//         message: "Please select a valid service type",
//       })
//       .optional(),
//     startDate: z.date().optional(),
//     endDate: z.date().optional(),
//     serviceCategory: z.enum(ServiceCategory).optional(),
//     ordinal: z.enum(Ordinal).optional(),
//     frequency: z.enum(Frequency).optional(),
//     cycle: z
//       .string()
//       .min(1)
//       .optional()
//       .refine((val) => {
//         if (val === undefined) return true; // allow undefined
//         const num = Number(val);
//         return !isNaN(num) && num > 0;
//       }),
//   })
//   .superRefine((data, ctx) => {
//     if (data.serviceCategory !== ServiceCategory.RECURRING) {
//       if (!data.startDate) {
//         ctx.addIssue({
//           code: "custom",
//           message: "Start date is required for this service type",
//           path: ["startDate"],
//         });
//       }
//     }

//     if (data.serviceCategory === ServiceCategory.ONETIME_MULTIDAY) {
//       if (!data.endDate && !data.cycle) {
//         ctx.addIssue({
//           code: "custom",
//           message:
//             "Frequency count / end date is required for this service type",
//           path: ["endDate"],
//         });

//         ctx.addIssue({
//           code: "custom",
//           message:
//             "Frequency count / end date is required for this service type",
//           path: ["cycle"],
//         });
//       }
//     }
//   });

// Union type for all schemas
export const serviceDaySchema = z.discriminatedUnion("serviceCategory", [
  recurringSchema,
  onetimeOneDaySchema,
  onetimeMultiDaySchema,
  frequentMultiDaySchema,
]);

export type ServiceDaySchema = z.infer<typeof serviceDaySchema>;
export type RecurringSchema = z.infer<typeof recurringSchema>;
export type OnetimeOneDaySchema = z.infer<typeof onetimeOneDaySchema>;
export type OnetimeMultiDaySchema = z.infer<typeof onetimeMultiDaySchema>;
export type FrequentMultiDaySchema = z.infer<typeof frequentMultiDaySchema>;
