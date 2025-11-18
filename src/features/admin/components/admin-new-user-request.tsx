/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths, format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  Clock,
  Loader2Icon,
  MapPin,
  Pencil,
  Send,
  User,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, UseFormReturn, useWatch } from "react-hook-form";
import { toast } from "sonner";

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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

import { CustomFormLabel } from "@/components/custom-form-label";
import { PickUpDropOffField } from "@/features/requests/components/pickup-dropoff-field";
import { UserType } from "@/features/users/types";
import { useConfirm } from "@/hooks/use-confirm";
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
import { NewUserSchema } from "@/schemas/adminCreateNewUserSchema";
import {
  newAdminRequestSchema,
  NewAdminRequestSchema,
} from "@/schemas/newRequestSchema";
import { useTRPC } from "@/trpc/client";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { GetServiceType } from "../types";
import { ServiceDaySelector } from "./services/service-day-selector";

interface AdminNewUserRequestProps {
  isNewUser: boolean;
  isGroupRequest: boolean;
  isRecurringRequest: boolean;
  formRequestDate?: Date | undefined;
  form?: UseFormReturn<NewUserSchema>;
  newRequestData?: NewAdminRequestSchema & {
    requestId: string;
    seriesId: string | null;
  };
  setShowDialog?: (value: boolean) => void;
}
const AdminNewUserRequest = ({
  isNewUser,
  isGroupRequest,
  isRecurringRequest,
  form,
  formRequestDate,
  newRequestData,
  setShowDialog,
}: AdminNewUserRequestProps) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [usersOpen, setUsersOpen] = useState(false);
  const [userAddressesOpen, setUserAddressesOpen] = useState(false);

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
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  const [SeriesUpdateDialog, confirmSeriesUpdate] = useConfirm(
    "Update Series/Occurrence",
    "Do you want to update the entire ride request series or just this ride occurrence?",
    true,
    "Update occurrence",
    "Update series"
  );

  const { data: serviceDays, isLoading: servicesLoading } = useSuspenseQuery(
    trpc.services.getServices.queryOptions({
      status: "active",
    })
  );

  const { data: users, isLoading: usersLoading } = useSuspenseQuery(
    trpc.users.getUsers.queryOptions({})
  );

  const { data: addresses = [], isLoading: userAddressesLoading } = useQuery(
    trpc.adminUser.getUserAddresses.queryOptions(
      selectedUser ? { id: selectedUser.id } : skipToken
    )
  );

  const newRequestForm = useForm<NewAdminRequestSchema>({
    resolver: zodResolver(newAdminRequestSchema),
    defaultValues: {
      userId: newRequestData?.userId || "",
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

  // New user request form service day
  const serviceDayId = form ? form?.watch("serviceDayId") : "";
  useEffect(() => {
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
          form?.setValue("serviceDayOfWeek", `${dayOfWeek}-${1}`);
          form?.setValue("requestDate", nextDate);
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
            const occurrences = getNextOccurrencesOfWeekdays({
              fromDate: new Date(service?.startDate),
              allowedWeekdays: [dayOfWeek],
              count: 1,
              frequency: service.frequency,
              ordinal: service.ordinal,
            });

            if (occurrences.length > 0) {
              const nextDate = occurrences[0];
              form?.setValue("serviceDayOfWeek", `${dayOfWeek}-${1}`);
              form?.setValue("requestDate", nextDate);
            }
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
          form?.setValue("serviceDayOfWeek", undefined);
          form?.resetField("requestDate");
        }
      }
    }
  }, [serviceDayId, serviceDays]);

  // New request form service day
  const newServiceDayId = useWatch({
    control: newRequestForm.control,
    name: "serviceDayId",
  });

  useEffect(() => {
    if (!newRequestData && newServiceDayId && serviceDays.length > 0) {
      const service = serviceDays.find((s) => s.id === newServiceDayId);
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
          newRequestForm.setValue("serviceDayOfWeek", `${dayOfWeek}-${1}`);
          newRequestForm.setValue("requestDate", nextDate);
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

            newRequestForm.setValue("serviceDayOfWeek", `${dayOfWeek}-${1}`);
            newRequestForm.setValue("requestDate", nextDate);
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
          newRequestForm.setValue("serviceDayOfWeek", undefined);
          newRequestForm.resetField("requestDate");
        }
      }
    }
  }, [newServiceDayId, serviceDays]);

  const addressId = newRequestForm.watch("addressId");
  useEffect(() => {
    if (addressId && addresses.length > 0) {
      const address = addresses.find((a) => a.id === addressId);
      setSelectedAddress(address || null);
    }
  }, [addressId, addresses]);

  const userId = newRequestForm.watch("userId");
  useEffect(() => {
    if (userId && users.length > 0) {
      const user = users.find((u) => u.id === userId);
      setSelectedUser(user || null);
    }
  }, [userId, users]);

  const createRequest = useMutation(
    trpc.userRequests.createUserRequest.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          data.length > 1
            ? "Request series was created successfully"
            : "Request was created successfully"
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
      onSuccess: (data) => {
        toast.success(
          data.length === 1
            ? `Request was updated successfully.`
            : `${data.length} request in the series was updated successfully.`
        );

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

  const handleSubmit = async (values: NewAdminRequestSchema) => {
    const validatedFields = await newAdminRequestSchema.safeParseAsync(values);

    if (!validatedFields.success) {
      toast.error(
        validatedFields.error.message || "Please fill in all required fields"
      );
      return;
    }

    await createRequest.mutateAsync(validatedFields.data);
  };

  const handleUpdate = async (values: NewAdminRequestSchema) => {
    const validatedFields = await newAdminRequestSchema.safeParseAsync({
      ...values,
      serviceDayOfWeek: `${newRequestData?.serviceDayOfWeek}-1` || "",
    });

    if (!validatedFields.success) {
      toast.error(
        validatedFields.error.message || "Please fill in all required fields"
      );
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
  };

  const isGroupRequestNewForm = newRequestForm.watch("isGroupRide");
  const isRecurringRequestNewForm = newRequestForm.watch("isRecurring");
  const newFormRequestDate = newRequestForm.watch("requestDate");

  const isLoading = createRequest.isPending || updateRequest.isPending;

  return (
    <>
      <SeriesUpdateDialog />
      {isNewUser && form ? (
        <>
          {/* Service Selection */}
          <FormField
            control={form.control}
            name="serviceDayId"
            render={({ field }) => {
              return (
                <FormItem className="space-y-2">
                  <CustomFormLabel title="Church Service" />
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                        <Clock className="size-4" />
                        <span>
                          Service starts at {formatTime(selectedService.time)}{" "}
                          every {getDayNameFromNumber(selectedDayOfWeek)}
                        </span>
                      </span>
                    </FormDescription>
                  )}
                  <div className="min-h-[1.25rem]">
                    <FormMessage />
                  </div>
                </FormItem>
              );
            }}
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
                              new Date(formatDate(new Date(field.value))),
                              "PPP"
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

          {/* Pickup and Dropoff Options */}
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <PickUpDropOffField form={form!} />
          </div>

          {/* Group Ride */}
          <div className="flex flex-col justify-between rounded-lg border p-3 shadow-sm mt-4">
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
                        form?.setValue("numberOfGroup", !checked ? null : 2);
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
          <div className="flex flex-col justify-between rounded-lg border p-3 shadow-sm mt-4">
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
                        const startDate = form?.getValues("requestDate");
                        const maxEndDate = addMonths(startDate as Date, 3);
                        form?.setValue(
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

                  const startDate = form?.getValues("requestDate");

                  const maxEndDate = addMonths(startDate as Date, 3);

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
                              <CalendarIcon className="ml-auto size-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value
                                ? new Date(formatDate(field.value))
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
        </>
      ) : (
        <div className="space-y-6 w-full">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                {newRequestData ? (
                  <Button variant="ghost" size="icon" className="cursor-none">
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
                  {newRequestData ? "Update" : "New"} Pickup Request
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
              <Form {...newRequestForm}>
                <form
                  onSubmit={
                    newRequestData
                      ? newRequestForm.handleSubmit(handleUpdate)
                      : newRequestForm.handleSubmit(handleSubmit)
                  }
                  className="space-y-6 w-full min-w-0"
                >
                  {/* User Selection */}
                  <FormField
                    control={newRequestForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <CustomFormLabel title="On Behalf of" />
                        <Popover open={usersOpen} onOpenChange={setUsersOpen}>
                          <PopoverTrigger
                            asChild
                            className="w-full"
                            disabled={isLoading}
                          >
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={usersOpen}
                                disabled={!!newRequestData || usersLoading}
                                className={cn(
                                  "justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <span className="flex items-center gap-x-2">
                                  <UserCheck className="size-4 text-muted-foreground" />
                                  {field.value
                                    ? users.find((s) => s.id === field.value)
                                        ?.name
                                    : "Select a user"}
                                </span>
                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search users..." />
                              <CommandList>
                                <CommandEmpty>No users found.</CommandEmpty>
                                <CommandGroup>
                                  {users.map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      value={user.id}
                                      onSelect={() => {
                                        newRequestForm.setValue(
                                          "userId",
                                          user.id
                                        );
                                        setUsersOpen(false);
                                      }}
                                      className={cn(
                                        field.value === user.id &&
                                          "font-semibold"
                                      )}
                                    >
                                      {field.value === user.id ? (
                                        <UserCheck
                                          className={cn("mr-2 size-4")}
                                        />
                                      ) : (
                                        <User className={cn("mr-2 size-4")} />
                                      )}
                                      {user.name}
                                      <Check
                                        className={cn(
                                          "ml-auto size-4",
                                          field.value === user.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {selectedUser && (
                          <FormDescription className="mt-2 p-3 bg-blue-50 rounded-lg">
                            {!newRequestData ? (
                              <>
                                <span className="flex items-center space-x-2 text-sm text-gray-700">
                                  <UserCheck className="size-4" />
                                  <span>{selectedUser.name}</span>
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-900 mt-1">
                                  Please ensure this is the person you want to
                                  request a ride on behalf of
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-900 mt-1">
                                You cannot change the user for this request
                              </span>
                            )}
                          </FormDescription>
                        )}
                        <div className="min-h-[1.25rem]">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Service Selection */}
                  <FormField
                    control={newRequestForm.control}
                    name="serviceDayId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <CustomFormLabel title="Church Service" />
                        <Popover
                          open={userAddressesOpen}
                          onOpenChange={setUserAddressesOpen}
                        >
                          <PopoverTrigger
                            asChild
                            className="w-full"
                            disabled={isLoading}
                          >
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={userAddressesOpen}
                                disabled={!!newRequestData || servicesLoading}
                                className={cn(
                                  "justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <span className="flex items-center gap-x-2">
                                  <CalendarIcon className="size-4 text-muted-foreground" />
                                  {field.value
                                    ? (() => {
                                        const service = serviceDays.find(
                                          (s) => s.id === field.value
                                        );
                                        if (!service?.time) {
                                          return service?.name;
                                        }
                                        return `${service?.name} - ${formatTime(service?.time)}`;
                                      })()
                                    : "Select a service"}
                                </span>
                                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search services..." />
                              <CommandList>
                                <CommandEmpty>No services found.</CommandEmpty>
                                <CommandGroup>
                                  {serviceDays.map((service) => (
                                    <CommandItem
                                      key={service.id}
                                      value={service.id}
                                      onSelect={() => {
                                        newRequestForm.setValue(
                                          "serviceDayId",
                                          service.id
                                        );
                                        setUsersOpen(false);
                                      }}
                                      className={cn(
                                        field.value === service.id &&
                                          "font-semibold"
                                      )}
                                    >
                                      <CalendarIcon className={cn("size-4")} />
                                      {service.name} -{" "}
                                      {formatTime(service.time)}
                                      <Check
                                        className={cn(
                                          "ml-auto size-4",
                                          field.value === service.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {selectedService && selectedDayOfWeek != null && (
                          <FormDescription className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <span className="flex items-center space-x-2 text-sm text-blue-700">
                              <Clock className="size-4" />
                              <span>
                                Service starts at{" "}
                                {formatTime(selectedService.time)} every{" "}
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
                      form={newRequestForm}
                      selectedService={selectedService}
                      dayOptions={dayOptions}
                      setSelectedDayOfWeek={setSelectedDayOfWeek}
                      isLoading={isLoading}
                    />
                  )}

                  {/* Date Selection */}
                  <FormField
                    control={newRequestForm.control}
                    name="requestDate"
                    render={({ field }) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      return (
                        <FormItem className="space-y-2">
                          <CustomFormLabel title="Service Date" />
                          <Popover>
                            <PopoverTrigger
                              asChild
                              className="w-full"
                              disabled={isLoading}
                            >
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
                                      new Date(
                                        formatDate(new Date(field.value))
                                      ),
                                      "PPP"
                                    )
                                  ) : (
                                    <span>Select a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto size-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={
                                  new Date(formatDate(new Date(field.value)))
                                }
                                onSelect={field.onChange}
                                disabled={(date) => date < today}
                                captionLayout="dropdown"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-200">
                            Requests must be made at least 2 hour before the
                            service
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
                    control={newRequestForm.control}
                    name="addressId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <CustomFormLabel title="Pickup Address" />
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={
                            !selectedUser ||
                            usersLoading ||
                            userAddressesLoading
                          }
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                !newRequestData
                                  ? "w-full"
                                  : "max-w-[min(calc(100vw-4rem),430px)]"
                              )}
                              disabled={isLoading}
                            >
                              <SelectValue placeholder="Select pickup address" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedUser?.addresses?.map((address) => (
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
                            <span className="text-xs text-gray-500 dark:text-gray-900  mt-1 block">
                              Please ensure this address is correct before
                              submitting your request
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
                    <PickUpDropOffField form={newRequestForm} />
                  </div>

                  {/* Group Ride */}
                  <div className="flex flex-col justify-between rounded-lg border p-3 shadow-sm">
                    <FormField
                      control={newRequestForm.control}
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
                                newRequestForm.setValue(
                                  "numberOfGroup",
                                  !checked ? null : 2
                                );
                                field.onChange(checked);
                              }}
                              disabled={isLoading}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {isGroupRequestNewForm && (
                      <FormField
                        control={newRequestForm.control}
                        name="numberOfGroup"
                        render={({ field }) => (
                          <FormItem>
                            <CustomFormLabel title="Number of people" />
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
                                  field.onChange(
                                    val === "" ? null : parseInt(val, 10)
                                  );
                                }}
                                disabled={isLoading}
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
                        control={newRequestForm.control}
                        name="isRecurring"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between pb-3">
                            <div className="space-y-0.5">
                              <FormLabel>Recurring Request</FormLabel>
                              <FormDescription>
                                Will you like to make a multiple request for
                                this service? Service Date must be a valid date
                                to enable recurring ride requests.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  const startDate =
                                    newRequestForm.getValues("requestDate");
                                  const maxEndDate = addMonths(
                                    startDate as Date,
                                    3
                                  );
                                  newRequestForm.setValue(
                                    "endDate",
                                    !checked ? undefined : maxEndDate
                                  );
                                  field.onChange(checked);
                                }}
                                disabled={!newFormRequestDate || isLoading}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {isRecurringRequestNewForm && (
                        <FormField
                          control={newRequestForm.control}
                          name="endDate"
                          render={({ field }) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            const startDate = form?.getValues("requestDate");

                            const maxEndDate = addMonths(startDate as Date, 3);

                            const maxEndMonth = addMonths(today, 4);

                            return (
                              <FormItem className="space-y-2">
                                <CustomFormLabel title="End Date" />
                                <Popover>
                                  <PopoverTrigger
                                    asChild
                                    className="w-full"
                                    disabled={isLoading}
                                  >
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value &&
                                            "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(
                                            new Date(
                                              formatDate(new Date(field.value))
                                            ),
                                            "PPP"
                                          )
                                        ) : (
                                          <span>Select a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={
                                        field.value
                                          ? new Date(formatDate(field.value))
                                          : undefined
                                      }
                                      endMonth={maxEndMonth}
                                      defaultMonth={
                                        field.value
                                          ? new Date(field.value)
                                          : today
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
                    control={newRequestForm.control}
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
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500 dark:text-gray-200">
                          Optional: Let your driver know about any special
                          requirements or instructions
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
                        • Pickup requests must be submitted latest 2 hour before
                        the service
                      </li>
                      <li>
                        • A driver will accept your request and contact you with
                        details
                      </li>
                      <li>
                        • Please be ready at your pickup address 10 minutes
                        early
                      </li>
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
                        <Link
                          href="/requests"
                          aria-label="Cancel Pickup Request"
                        >
                          Cancel
                        </Link>
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isLoading || !newRequestForm.formState.isDirty}
                    >
                      {isLoading && (
                        <Loader2Icon className="size-4 animate-spin" />
                      )}
                      {isLoading ? (
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
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default AdminNewUserRequest;
