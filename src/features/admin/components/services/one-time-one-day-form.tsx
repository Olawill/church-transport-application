// components/admin/service-forms/OnetimeOneDayForm.tsx
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
import { DAYS_OF_WEEK } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { OnetimeOneDaySchema } from "@/schemas/serviceDaySchema";
import { addMonths, format } from "date-fns";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { GetServiceType } from "../../types";
import { canRestore } from "../../utils";

interface OnetimeOneDayFormProps {
  form: UseFormReturn<OnetimeOneDaySchema>;
  onSubmit: (values: OnetimeOneDaySchema) => void;
  onCancel: () => void;
  loading: boolean;
  service: GetServiceType | null;
}

export const OnetimeOneDayForm = ({
  form,
  onSubmit,
  onCancel,
  loading,
  service,
}: OnetimeOneDayFormProps) => {
  const isEditing = !!service;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>
                Service Name<span className="text-red-400">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Easter Service"
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
            <FormItem className={cn("col-span-1", !isEditing && "col-span-2")}>
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

        {isEditing && (
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 pt-8">
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
                <FormDescription>
                  Date for this one-time service
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
