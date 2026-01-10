// components/admin/service-forms/OnetimeMultiDayForm.tsx
import { CustomFormLabel } from "@/components/custom-form-label";
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
import { DAYS_OF_WEEK, frequencyOptions } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { OnetimeMultiDaySchema } from "@/schemas/serviceDaySchema";
import { addMonths, format } from "date-fns";
import { CalendarIcon, CheckCircle, Loader2Icon, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { GetServiceType } from "../../types";
import { canRestore } from "../../utils";

interface OnetimeMultiDayFormProps {
  form: UseFormReturn<OnetimeMultiDaySchema>;
  onSubmit: (values: OnetimeMultiDaySchema) => void;
  onCancel: () => void;
  loading: boolean;
  service: GetServiceType | null;
}

export const OnetimeMultiDayForm = ({
  form,
  onSubmit,
  onCancel,
  loading,
  service,
}: OnetimeMultiDayFormProps) => {
  const isEditing = !!service;

  // const selectedDays = form.watch("dayOfWeek") || [];
  const dayOfWeekValue = form.watch("dayOfWeek");
  const selectedDays = Array.isArray(dayOfWeekValue) ? dayOfWeekValue : [];

  const toggleDay = (dayValue: string) => {
    const currentDays = form.getValues("dayOfWeek") || [];
    if (currentDays.includes(dayValue)) {
      form.setValue(
        "dayOfWeek",
        currentDays.filter((d) => d !== dayValue),
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {/* Service Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-3 mb-4">
              <CustomFormLabel title="Service Name" />
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. VBS Week"
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

        {/* Day of the Week - Multi-select */}
        <FormField
          control={form.control}
          name="dayOfWeek"
          render={({ field }) => (
            <FormItem className="col-span-3">
              <CustomFormLabel title="Days of Week" />
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !selectedDays.length && "text-muted-foreground",
                      )}
                    >
                      {selectedDays.length > 0
                        ? `${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""} selected`
                        : "Select days"}
                      <CalendarIcon className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.value}
                        className={cn(
                          "hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5 text-sm",
                          selectedDays.includes(day.value.toString()) &&
                            "bg-accent",
                        )}
                        onClick={() => toggleDay(day.value.toString())}
                      >
                        <div
                          className={cn(
                            "flex size-4 items-center justify-center rounded-sm border",
                            selectedDays.includes(day.value.toString()) &&
                              "bg-primary border-primary",
                          )}
                        >
                          {selectedDays.includes(day.value.toString()) && (
                            <CheckCircle className="text-primary-foreground size-3" />
                          )}
                        </div>
                        <span>{day.label}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedDays.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
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
                        className="h-full cursor-pointer rounded-sm pr-0 hover:bg-gray-200"
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
              <FormLabel>Frequency Cycle</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={1}
                  placeholder="e.g. 2"
                  disabled={loading}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  className="tabular-nums placeholder:text-sm"
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
            <FormItem className={cn("col-span-1", !isEditing && "col-span-2")}>
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
                    className="cursor-pointer disabled:cursor-not-allowed"
                  />
                </FormControl>
                <FormLabel className="!mt-0">
                  {field.value ? "Active" : "Inactive"}
                </FormLabel>
                <FormDescription>&nbsp;</FormDescription>
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
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
                <CustomFormLabel title="Start Date" />
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
                <FormDescription>Program start date</FormDescription>
                <div className="min-h-[1.25rem]">
                  <FormMessage />
                </div>
              </FormItem>
            );
          }}
        />

        {/* End Date */}
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = form.watch("startDate");
            const maxEndMonth = addMonths(today, 12);

            return (
              <FormItem>
                <FormLabel>End Date</FormLabel>
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
                      defaultMonth={
                        field.value ? new Date(field.value) : startDate || today
                      }
                      disabled={(date) => date < (startDate || today)}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Optional end date</FormDescription>
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
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
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
