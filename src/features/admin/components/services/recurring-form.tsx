import { cn, formatDate } from "@/lib/utils";
import { addMonths, format } from "date-fns";
import { UseFormReturn } from "react-hook-form";

import { Frequency, Ordinal } from "@/generated/prisma/enums";
import { DAYS_OF_WEEK, frequencyOptions } from "@/lib/types";
import { RecurringSchema } from "@/schemas/serviceDaySchema";

import { CustomFormLabel } from "@/components/custom-form-label";
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
import { CalendarIcon, CheckCircle, Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { GetServiceType } from "../../types";
import { canRestore } from "../../utils";

interface RecurringFormProps {
  form: UseFormReturn<RecurringSchema>;
  onSubmit: (values: RecurringSchema) => void;
  onCancel: () => void;
  loading: boolean;
  service: GetServiceType | null;
}

export const RecurringForm = ({
  form,
  onSubmit,
  onCancel,
  loading,
  service,
}: RecurringFormProps) => {
  const isEditing = !!service;

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
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {/* Service Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-3 mb-2">
              <CustomFormLabel title="Service Name" />
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Sunday Morning Service"
                  disabled={loading}
                  className="placeholder:text-sm"
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
            <FormItem className="col-span-3 md:col-span-1">
              <CustomFormLabel title="Day of Week" />
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
              <CustomFormLabel title="Frequency" />
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
              <CustomFormLabel title="Ordinal" />
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
            <Separator className="col-span-3 my-4" />
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
                        disabled={!canRestore(service)}
                        className="cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <Separator className="col-span-3 my-4" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
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
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(
                            new Date(formatDate(new Date(field.value))),
                            "PPP",
                          )
                        ) : (
                          <span>Select a date</span>
                        )}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
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
              <CustomFormLabel title="Start Time" />
              <FormControl>
                <Input
                  {...field}
                  type="time"
                  disabled={loading}
                  className="bg-background relative appearance-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2"
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
        <Button type="submit" disabled={loading || !form.formState.isDirty}>
          {loading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CheckCircle className="size-4" />
          )}
          {isEditing ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
};
