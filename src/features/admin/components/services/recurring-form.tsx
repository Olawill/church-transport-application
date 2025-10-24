import { cn, formatDate } from "@/lib/utils";
import { addMonths, format } from "date-fns";
import { UseFormReturn } from "react-hook-form";

import { Frequency, Ordinal } from "@/generated/prisma";
import { DAYS_OF_WEEK, frequencyOptions } from "@/lib/types";
import { RecurringSchema } from "@/schemas/serviceDaySchema";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { useEffect } from "react";

interface RecurringFormProps {
  form: UseFormReturn<RecurringSchema>;
  onSubmit: (values: RecurringSchema) => void;
  onCancel: () => void;
  loading: boolean;
  isEditing: boolean;
}

export const RecurringForm = ({
  form,
  onSubmit,
  onCancel,
  loading,
  isEditing,
}: RecurringFormProps) => {
  const frequency = form.watch("frequency");

  const ordinalOptions =
    frequency === Frequency.DAILY || frequency === Frequency.WEEKLY
      ? [Ordinal.NEXT]
      : Object.values(Ordinal);

  useEffect(() => {
    const currentOrdinal = form.getValues("ordinal");
    if (
      (frequency === Frequency.DAILY || frequency === Frequency.WEEKLY) &&
      currentOrdinal !== Ordinal.NEXT
    ) {
      form.setValue("ordinal", Ordinal.NEXT);
    }
  }, [form, frequency]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Service Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-3 mb-4">
              <FormLabel>
                Service Name<span className="text-red-400">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Sunday Morning Service"
                  disabled={loading}
                />
              </FormControl>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Day of the Week */}
        <FormField
          control={form.control}
          name="dayOfWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Day of Week<span className="text-red-400">*</span>
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Service Frequency */}
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Frequency<span className="text-red-400">*</span>
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {frequencyOptions.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Ordinal Type */}
        <FormField
          control={form.control}
          name="ordinal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Ordinal<span className="text-red-400">*</span>
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select ordinal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ordinalOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0) + option.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {isEditing && (
          <>
            <Separator className="my-4 col-span-3" />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="col-span-3 flex items-center justify-between space-x-2">
                  <FormLabel>Is this service still active?</FormLabel>
                  <FormControl>
                    <div className="flex space-x-2 text-sm">
                      <span>{field.value ? "Active" : "Inactive"}</span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <Separator className="my-4 col-span-3" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const maxEndMonth = addMonths(today, 12);

            return (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(
                            new Date(formatDate(new Date(field.value))),
                            "PPP"
                          )
                        ) : (
                          <span>Select a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        field.value
                          ? new Date(formatDate(new Date(field.value)))
                          : undefined
                      }
                      onSelect={field.onChange}
                      endMonth={maxEndMonth}
                      defaultMonth={field.value ? new Date(field.value) : today}
                      disabled={(date) => date < today}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Optional start date for this service
                </FormDescription>
                <div className="min-h-[1.25rem]">
                  <FormMessage />
                </div>
              </FormItem>
            );
          }}
        />

        {/* Start Time */}
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Start Time<span className="text-red-400">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="time"
                  disabled={loading}
                  className="bg-background appearance-none relative [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2"
                />
              </FormControl>
              <FormDescription>Service start time</FormDescription>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <CheckCircle className="h-4 w-4 mr-2" />
          {isEditing ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
};
