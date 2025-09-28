import z from "zod";

export const serviceDaySchema = z.object({
  name: z.string().min(1, "Service name is required"),
  dayOfWeek: z.string().min(1, "Please select a valid day of the week"),
  time: z.string().min(1, "Service time is required"),
  isActive: z.boolean().optional(),
  serviceType: z.enum(["REGULAR", "SPECIAL"], {
    message: "Please select a valid service type",
  }),
});

export type ServiceDaySchema = z.infer<typeof serviceDaySchema>;
