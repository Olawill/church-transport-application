import { CalendarIcon } from "lucide-react";
import { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";

import { ServiceDay } from "@/lib/types";
import {
  cn,
  getNextOccurrencesOfWeekdays,
  isWithinRequestBuffer,
} from "@/lib/utils";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the common fields that both forms share
interface ServiceDayFormFields extends FieldValues {
  serviceDayOfWeek?: string;
  requestDate?: Date;
}

interface ServiceDaySelectorProps<T extends ServiceDayFormFields> {
  form: UseFormReturn<T>;
  selectedService: ServiceDay | null;
  dayOptions: Array<{ value: string; label: string; dayOfWeek: number }>;
  setSelectedDayOfWeek: (val: number) => void;
}

export const ServiceDaySelector = <T extends ServiceDayFormFields>({
  form,
  selectedService,
  dayOptions,
  setSelectedDayOfWeek,
}: ServiceDaySelectorProps<T>) => {
  return (
    <FormField
      control={form.control}
      name={"serviceDayOfWeek" as Path<T>}
      render={({ field }) => {
        // Calculate occurrences once for all options
        const daysOfWeek =
          selectedService?.weekdays?.map((w) => w.dayOfWeek) || [];
        const cycle = selectedService?.cycle || 1;
        const count =
          selectedService?.frequency === "DAILY"
            ? cycle
            : daysOfWeek.length * cycle;

        const occurrences = selectedService
          ? getNextOccurrencesOfWeekdays({
              fromDate: new Date(selectedService.startDate || new Date()),
              allowedWeekdays: daysOfWeek,
              count,
              endDate: selectedService.endDate ?? undefined,
              frequency: selectedService.frequency || "WEEKLY",
              ordinal: selectedService.ordinal || "NEXT",
            })
          : [];

        return (
          <FormItem className="space-y-2">
            <FormLabel>
              Select Service Day
              <span className="text-red-400">*</span>
            </FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                // Extract day of week from the value
                const option = dayOptions.find((opt) => opt.value === value);

                if (option && selectedService && selectedService.weekdays) {
                  setSelectedDayOfWeek(option.dayOfWeek);

                  const optionIndex = Number(option.value.split("-")[1]);

                  if (optionIndex > 0 && optionIndex <= occurrences.length) {
                    const nextDate = occurrences[optionIndex - 1];

                    form?.setValue(
                      "requestDate" as Path<T>,
                      nextDate as PathValue<T, Path<T>>
                    );
                  }
                }
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select which day you need pickup" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {dayOptions.map((option) => {
                  const optionIndex = Number(option.value.split("-")[1]);
                  const optionDate = occurrences[optionIndex - 1];

                  const isTooSoon = selectedService?.time
                    ? isWithinRequestBuffer(optionDate, selectedService.time, 2)
                    : false;

                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="size-4" />
                        <span className={cn(isTooSoon && "text-gray-400")}>
                          {option.label}
                          {isTooSoon && " (Too soon)"}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormDescription>
              {selectedService?.cycle && selectedService.cycle > 1
                ? `This service runs for ${selectedService.cycle} ${selectedService.frequency.toLowerCase()} cycles on multiple days`
                : "Select the day you need pickup service"}
              <span className="block text-xs text-amber-600 mt-1">
                Note: Options less than 2 hours before service time are disabled
              </span>
            </FormDescription>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
