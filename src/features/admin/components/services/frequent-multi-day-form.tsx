// components/admin/service-forms/FrequentMultiDayForm.tsx
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Frequency, Ordinal } from "@/generated/prisma";
import { DAYS_OF_WEEK, frequencyOptions } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { FrequentMultiDaySchema } from "@/schemas/serviceDaySchema";
import { addMonths, format } from "date-fns";
import { CalendarIcon, CheckCircle, X } from "lucide-react";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { canRestore } from "../../utils";
import { GetServiceType } from "../../types";

interface FrequentMultiDayFormProps {
  form: UseFormReturn<FrequentMultiDaySchema>;
  onSubmit: (values: FrequentMultiDaySchema) => void;
  onCancel: () => void;
  loading: boolean;
  service: GetServiceType | null;
}

export const FrequentMultiDayForm = ({
  form,
  onSubmit,
  onCancel,
  loading,
  service,
}: FrequentMultiDayFormProps) => {
  const isEditing = !!service;

  // const selectedDays = form.watch("dayOfWeek") || [];
  const dayOfWeekValue = form.watch("dayOfWeek");
  const selectedDays = Array.isArray(dayOfWeekValue) ? dayOfWeekValue : [];
  const frequency = form.watch("frequency");

  // Auto-set ordinal to NEXT when frequency is DAILY or WEEKLY
  useEffect(() => {
    if (frequency === Frequency.DAILY || frequency === Frequency.WEEKLY) {
      form.setValue("ordinal", Ordinal.NEXT);
    }
  }, [frequency, form]);

  const isLimitedOrdinal =
    frequency === Frequency.DAILY || frequency === Frequency.WEEKLY;
  const ordinalOptions = isLimitedOrdinal
    ? [Ordinal.NEXT]
    : Object.values(Ordinal);

  const toggleDay = (dayValue: string) => {
    const currentDays = form.getValues("dayOfWeek") || [];
    if (currentDays.includes(dayValue)) {
      form.setValue(
        "dayOfWeek",
        currentDays.filter((d) => d !== dayValue)
      );
    } else {
      form.setValue("dayOfWeek", [...currentDays, dayValue]);
    }
  };

  const getDayName = (dayValue: string) => {
    return (
      DAYS_OF_WEEK.find((d) => d.value.toString() === dayValue)?.label ||
      dayValue
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Service Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-4 mb-4">
              <FormLabel>
                Service Name<span className="text-red-400">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Monthly Youth Program"
                  disabled={loading}
                />
              </FormControl>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Day of the Week - Multi-select */}
        <FormField
          control={form.control}
          name="dayOfWeek"
          render={() => (
            <FormItem className="col-span-4">
              <FormLabel>
                Days of Week<span className="text-red-400">*</span>
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !selectedDays.length && "text-muted-foreground"
                      )}
                    >
                      {selectedDays.length > 0
                        ? `${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""} selected`
                        : "Select days"}
                      <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.value}
                        role="button"
                        className={cn(
                          "flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                          selectedDays.includes(day.value.toString()) &&
                            "bg-accent"
                        )}
                        onClick={() => toggleDay(day.value.toString())}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 border rounded-sm flex items-center justify-center",
                            selectedDays.includes(day.value.toString()) &&
                              "bg-primary border-primary"
                          )}
                        >
                          {selectedDays.includes(day.value.toString()) && (
                            <CheckCircle className="size-3 text-primary-foreground" />
                          )}
                        </div>
                        <span>{day.label}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedDays.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDays.map((day) => (
                    <Badge key={day} variant="secondary" className="gap-1 pr-0">
                      {getDayName(day)}
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleDay(day);
                        }}
                        size="icon"
                        variant="ghost"
                        className="h-full pr-0 hover:bg-gray-200 rounded-sm cursor-pointer"
                      >
                        <X className="size-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Frequency Cycle */}
        <FormField
          control={form.control}
          name="cycle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Frequency Cycle<span className="text-red-400">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={1}
                  placeholder="e.g., 2"
                  disabled={loading}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                />
              </FormControl>
              <FormDescription>Number of cycles</FormDescription>
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
              <FormDescription>&nbsp;</FormDescription>
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
            <FormItem className={cn(!isEditing && "col-span-2")}>
              <FormLabel>
                Ordinal<span className="text-red-400">*</span>
              </FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading || isLimitedOrdinal}
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
              <FormDescription>&nbsp;</FormDescription>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {isEditing && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={!canRestore(service)}
                    className="disabled:cursor-not-allowed cursor-pointer"
                  />
                </FormControl>
                <FormLabel className="!mt-0">
                  {field.value ? "Active" : "Inactive"}
                </FormLabel>
              </FormItem>
            )}
          />
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
                <FormLabel>
                  Start Date<span className="text-red-400">*</span>
                </FormLabel>
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
                <FormDescription>Program start date</FormDescription>
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
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !form.formState.isDirty}>
          <CheckCircle className="h-4 w-4 mr-2" />
          {isEditing ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
};
