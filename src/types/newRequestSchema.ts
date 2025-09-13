import { z } from "zod";

export const newRequestSchema = z.object({
  serviceDayId: z.string().min(1, "Service selection is required"),
  requestDate: z.string().refine(
    (date) => {
      const now = new Date();
      const selectedDate = new Date(date);
      return (
        selectedDate.toString() !== "Invalid Date" &&
        selectedDate >= new Date(now.toDateString())
      );
    },
    {
      message: "Please select a valid date that is today or later",
    }
  ),
  addressId: z.string().min(1, "Pickup address is required"),
  notes: z.string().optional(),
});

export type NewRequestSchema = z.infer<typeof newRequestSchema>;
