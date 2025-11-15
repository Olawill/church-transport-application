"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths, format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  MapPin,
  Pencil,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { ServiceDaySelector } from "@/features/admin/components/services/service-day-selector";
import { ConfirmResult, useConfirm } from "@/hooks/use-confirm";
import { Address } from "@/lib/types";
import {
  cn,
  formatAddress,
  formatDate,
  formatTime,
  getDayNameFromNumber,
  getNextOccurrencesOfWeekdays,
  getNextServiceDate,
  getServiceDayOptions,
} from "@/lib/utils";
import { newRequestSchema, NewRequestSchema } from "@/schemas/newRequestSchema";
import { PickUpDropOffField } from "./pickup-dropoff-field";

import { CustomFormLabel } from "@/components/custom-form-label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
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
import { Textarea } from "@/components/ui/textarea";
import { GetServiceType } from "@/features/admin/types";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

interface NewRequestFormProps {
  newRequestData?: NewRequestSchema & {
    requestId: string;
    seriesId: string | null;
  };
  setShowDialog?: (value: boolean) => void;
}

export const NewRequestForm = ({
  newRequestData,
  setShowDialog,
}: NewRequestFormProps) => {
  const [SeriesUpdateDialog, confirmSeriesUpdate] = useConfirm(
    "Update Series",
    "Do you want to update the entire series or occurrence?",
    true,
    "Update occurrence",
    "Update series"
  );

  return (
    <>
      <SeriesUpdateDialog />

      <div className="space-y-6 w-full">
        {/* {!newRequestData && ( */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              {newRequestData ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-none hover:bg-transparent"
                >
                  <Pencil className="size-4" />
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/requests">
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              )}
              <h1 className="text-2xl font-bold">
                {newRequestData ? "Update" : "New"} Ride Request
              </h1>
            </div>
            <p className="text-primary">
              Request transportation to church services
            </p>
          </div>
        </div>

        <Card className={cn(newRequestData && "shadow-none")}>
          <CardHeader>
            <CardTitle className="text-lg">Request Details</CardTitle>
            <CardDescription>
              Please {newRequestData ? "update" : "provide"} the details for
              your pickup request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestForm
              newRequestData={newRequestData}
              setShowDialog={setShowDialog}
              confirmSeriesUpdate={confirmSeriesUpdate}
            />
          </CardContent>
        </Card>
        {/* )} */}
      </div>
    </>
  );
};

const RequestForm = ({
  newRequestData,
  setShowDialog,
  confirmSeriesUpdate,
}: NewRequestFormProps & {
  confirmSeriesUpdate: () => Promise<ConfirmResult>;
}) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [selectedService, setSelectedService] = useState<GetServiceType | null>(
    null
  );
  const [dayOptions, setDayOptions] = useState<
    Array<{ value: string; label: string; dayOfWeek: number }>
  >([]);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number | null>(
    null
  );
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const { data: serviceDays } = useSuspenseQuery(
    trpc.services.getServices.queryOptions({
      status: "active",
    })
  );

  const { data: addresses } = useSuspenseQuery(
    trpc.userAddresses.getUserAddresses.queryOptions()
  );

  const form = useForm<NewRequestSchema>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      serviceDayId: newRequestData?.serviceDayId || "",
      addressId: newRequestData?.addressId || "",
      requestDate: newRequestData?.requestDate
        ? new Date(newRequestData.requestDate)
        : undefined,
      isPickUp: newRequestData?.isPickUp ?? true,
      isDropOff: newRequestData?.isDropOff ?? false,
      isGroupRide: newRequestData?.isGroupRide ?? false,
      numberOfGroup: newRequestData?.numberOfGroup ?? null,
      isRecurring: newRequestData?.isRecurring ?? false,
      endDate: newRequestData?.endDate
        ? new Date(newRequestData.endDate)
        : undefined,
      notes: newRequestData?.notes || "",
    },
  });

  const serviceDayId = useWatch({
    control: form.control,
    name: "serviceDayId",
  });

  useEffect(() => {
    // if (!newRequestData && serviceDayId && serviceDays.length > 0) {
    if (serviceDayId && serviceDays.length > 0) {
      const service = serviceDays.find((s) => s.id === serviceDayId);
      setSelectedService(service || null);

      if (service) {
        if (
          service.weekdays?.length === 1 &&
          service.serviceCategory === "RECURRING"
        ) {
          // Single day service - auto select
          const dayOfWeek = service.weekdays[0].dayOfWeek;
          setSelectedDayOfWeek(dayOfWeek);
          setDayOptions([]);
          // Set default request date to next occurrence of this service
          const nextDate = getNextServiceDate(dayOfWeek);
          form.setValue("serviceDayOfWeek", `${dayOfWeek}-${1}`);
          form.setValue("requestDate", nextDate);
        } else if (
          service.weekdays?.length === 1 &&
          service.serviceCategory === "ONETIME_ONEDAY"
        ) {
          // Single day service - auto select
          const dayOfWeek = service.weekdays[0].dayOfWeek;
          const serviceStartDateDayOfWeek =
            service.startDate && new Date(service?.startDate).getDay();

          setDayOptions([]);

          if (serviceStartDateDayOfWeek === dayOfWeek && service.startDate) {
            setSelectedDayOfWeek(dayOfWeek);
            const nextDate = getNextOccurrencesOfWeekdays({
              fromDate: new Date(service?.startDate),
              allowedWeekdays: [dayOfWeek],
              count: 1,
              frequency: service.frequency,
              ordinal: service.ordinal,
            })[0];

            form.setValue("serviceDayOfWeek", `${dayOfWeek}-${1}`);
            form.setValue("requestDate", nextDate);
          }
        } else if (
          service.weekdays &&
          service.weekdays?.length > 1 &&
          service.cycle &&
          service.cycle >= 1
        ) {
          const options = getServiceDayOptions(service);

          setDayOptions(options);
          setSelectedDayOfWeek(null);

          // Reset request date until user selects a day
          form.setValue("serviceDayOfWeek", undefined);
          form.resetField("requestDate");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceDayId, serviceDays]);

  const addressId = form.watch("addressId");
  useEffect(() => {
    if (addressId && addresses.length > 0) {
      const address = addresses.find((a) => a.id === addressId);
      setSelectedAddress(address || null);
    }
  }, [addressId, addresses]);

  // Logic to create/ update request
  const createRequest = useMutation(
    trpc.userRequests.createUserRequest.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          data.length > 1
            ? "Your request series was created successfully"
            : "Your request was created successfully"
        );

        queryClient.invalidateQueries(
          trpc.userRequests.getUserRequests.queryOptions({})
        );

        router.push("/requests");
      },
      onError: (error) => {
        toast.error(error.message || `Failed to create request`);
      },
    })
  );

  const updateRequest = useMutation(
    trpc.userRequests.updateUserRequest.mutationOptions({
      onSuccess: () => {
        toast.success(`Your request was updated successfully.`);

        queryClient.invalidateQueries(
          trpc.userRequests.getUserRequests.queryOptions({})
        );

        setShowDialog?.(false);

        router.push("/requests");
      },
      onError: (error) => {
        toast.error(error.message || `Failed to update request`);
      },
    })
  );

  const handleSubmit = async (values: NewRequestSchema) => {
    const validatedFields = await newRequestSchema.safeParseAsync(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createRequest.mutateAsync(validatedFields.data);
  };

  const handleUpdate = async (values: NewRequestSchema) => {
    const validatedFields = await newRequestSchema.safeParseAsync(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }

    // To update series or not
    let updateSeries: boolean = false;
    if (newRequestData?.seriesId) {
      const result = await confirmSeriesUpdate();

      // Handle the three possible results
      if (result === "cancel") {
        // User clicked cancel - do nothing
        return;
      } else if (result === "primary") {
        // User clicked "Update occurrence" - update only this one
        updateSeries = false;
      } else if (result === "secondary") {
        // User clicked "Update series" - update entire series
        updateSeries = true;
      }
    }

    await updateRequest.mutateAsync({
      requestId: newRequestData?.requestId,
      ...validatedFields.data,
      updateSeries,
    });

    // try {
    //   const response = await fetch("/api/pickup-requests", {
    //     method: "PATCH",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       requestId: newRequestData?.requestId,
    //       ...validatedFields.data,
    //       updateSeries,
    //     }),
    //   });
    //   if (response.ok) {
    //     toast.success(
    //       updateSeries
    //         ? "Request series updated successfully!"
    //         : "Pickup request updated successfully!"
    //     );
    //     setShowDialog?.(false);
    //     router.push("/requests");
    //   } else {
    //     const errorData = await response.json();
    //     toast.error(errorData.error || "Failed to update request");
    //   }
    // } catch (error) {
    //   console.error("Error updating request:", error);
    //   toast.error("An error occurred while updating the request");
    // }
  };

  const isGroupRequest = form.watch("isGroupRide");
  const isRecurringRequest = form.watch("isRecurring");
  const formRequestDate = form.watch("requestDate");

  return (
    <Form {...form}>
      <form
        onSubmit={
          newRequestData
            ? form.handleSubmit(handleUpdate)
            : form.handleSubmit(handleSubmit)
        }
        className="space-y-6 w-full min-w-0"
      >
        {/* Service Selection */}
        <FormField
          control={form.control}
          name="serviceDayId"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <CustomFormLabel title="Church Service" />
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="w-full">
                  {serviceDays.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="size-4" />
                        <span>
                          {service.name} - {formatTime(service.time)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedService && selectedDayOfWeek != null && (
                <FormDescription className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <span className="flex items-center space-x-2 text-sm text-blue-700">
                    <Clock className="h-4 w-4" />
                    <span>
                      Service starts at {formatTime(selectedService.time)} every{" "}
                      {getDayNameFromNumber(selectedDayOfWeek)}
                    </span>
                  </span>
                </FormDescription>
              )}
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Day of Week Selection - Only show for multi-day services */}
        {dayOptions.length > 0 && (
          <ServiceDaySelector
            form={form}
            selectedService={selectedService}
            dayOptions={dayOptions}
            setSelectedDayOfWeek={setSelectedDayOfWeek}
          />
        )}

        {/* Date Selection */}
        <FormField
          control={form.control}
          name="requestDate"
          render={({ field }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const maxEndMonth = addMonths(today, 12);

            return (
              <FormItem className="space-y-2">
                <CustomFormLabel title="Service Date" />
                <Popover>
                  <PopoverTrigger asChild className="w-full">
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(
                            // new Date(field.value),
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
                  <PopoverContent className="w-full p-0" align="start">
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
                <FormDescription className="text-xs text-gray-500 dark:text-gray-200">
                  Requests must be made at least 2 hour before the service
                </FormDescription>
                <div className="min-h-[1.25rem]">
                  <FormMessage />
                </div>
              </FormItem>
            );
          }}
        />

        {/* Address Selection */}
        <FormField
          control={form.control}
          name="addressId"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <CustomFormLabel title="Pickup Address" />
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger
                    className={cn(
                      !newRequestData
                        ? "w-full"
                        : "max-w-[min(calc(100vw-4rem),430px)]"
                    )}
                  >
                    <SelectValue placeholder="Select pickup address" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {addresses.map((address) => (
                    <SelectItem key={address.id} value={address.id}>
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <MapPin className="size-4 shrink-0" />
                        <span className="truncate flex-1">
                          {formatAddress(address)}
                        </span>
                        {address.isDefault && (
                          <span className="text-xs text-blue-600 shrink-0 whitespace-nowrap">
                            (Default)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAddress && (
                <FormDescription className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center space-x-2 text-sm text-gray-700 min-w-0">
                    <MapPin className="size-4" />
                    <span className="break-words">
                      {formatAddress(selectedAddress)}
                    </span>
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-200 mt-1 block">
                    Please ensure this address is correct before submitting your
                    request
                  </span>
                </FormDescription>
              )}
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Pickup and Dropoff Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PickUpDropOffField form={form} />
        </div>

        {/* Group Ride */}
        <div className="flex flex-col justify-between rounded-lg border p-3 shadow-sm">
          <FormField
            control={form.control}
            name="isGroupRide"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-0.5">
                  <FormLabel>Group Ride</FormLabel>
                  <FormDescription>
                    Is the request for a group (2 or more people)?.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      form.setValue("numberOfGroup", !checked ? null : 2);
                      field.onChange(checked);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isGroupRequest && (
            <FormField
              control={form.control}
              name="numberOfGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of people</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter number of people"
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      min={2}
                      max={10}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Convert empty string to null, otherwise to integer
                        field.onChange(val === "" ? null : parseInt(val, 10));
                      }}
                    />
                  </FormControl>
                  <div className="min-h-[1.25rem]">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Recurring Request */}
        {!newRequestData && (
          <div className="flex flex-col justify-between rounded-lg border p-3 shadow-sm">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between pb-3">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Request</FormLabel>
                    <FormDescription>
                      Will you like to make a multiple request for this service?
                      Service Date must be a valid date to enable recurring ride
                      requests.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        const startDate = form.getValues("requestDate");
                        const maxEndDate = addMonths(startDate, 3);
                        form.setValue(
                          "endDate",
                          !checked ? undefined : maxEndDate
                        );
                        field.onChange(checked);
                      }}
                      disabled={!formRequestDate}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecurringRequest && (
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const startDate = form.getValues("requestDate");

                  const maxEndDate = addMonths(startDate, 3);

                  const maxEndMonth = addMonths(today, 4);

                  return (
                    <FormItem className="space-y-2">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild className="w-full">
                          <FormControl>
                            <Button
                              variant={"outline"}
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
                        <PopoverContent className="w-full p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value
                                ? new Date(
                                    formatDate(new Date(field.value as Date))
                                  )
                                : undefined
                            }
                            endMonth={maxEndMonth}
                            defaultMonth={
                              field.value ? new Date(field.value) : today
                            }
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < today || date > maxEndDate
                            }
                            captionLayout="dropdown"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-xs text-gray-500 dark:text-gray-200">
                        End date must be between 2 weeks and 3 months
                      </FormDescription>
                      <div className="min-h-[1.25rem]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  );
                }}
              />
            )}
          </div>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  id="notes"
                  placeholder="Any special instructions or requirements..."
                  className="resize-none w-full"
                  rows={5}
                />
              </FormControl>
              <FormDescription className="text-xs text-gray-500 dark:text-gray-200">
                Optional: Let your driver know about any special requirements or
                instructions
              </FormDescription>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Important Information */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">
            Important Information
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>
              • Pickup requests must be submitted latest 2 hour before the
              service
            </li>
            <li>
              • A driver will accept your request and contact you with details
            </li>
            <li>• Please be ready at your pickup address 10 minutes early</li>
            <li>• Cancel your request if your plans change</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4">
          {newRequestData ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog?.(false)}
            >
              Cancel
            </Button>
          ) : (
            <Button asChild type="button" variant="outline">
              <Link href="/requests" aria-label="Cancel Pickup Request">
                Cancel
              </Link>
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              createRequest.isPending ||
              updateRequest.isPending ||
              !form.formState.isDirty
            }
          >
            {createRequest.isPending || updateRequest.isPending ? (
              newRequestData ? (
                "Updating Request..."
              ) : (
                "Creating Request..."
              )
            ) : (
              <>
                <Send className="size-4" />
                {newRequestData ? "Update Request" : "Submit Request"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
