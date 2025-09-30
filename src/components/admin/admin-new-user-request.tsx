/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  MapPin,
  Pencil,
  Send,
  User2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";

import { Address, ServiceDay, User } from "@/lib/types";
import {
  cn,
  formatAddress,
  formatDate,
  formatTime,
  getNextServiceDate,
} from "@/lib/utils";
import {
  newAdminRequestSchema,
  NewAdminRequestSchema,
} from "@/types/newRequestSchema";
import { useForm, UseFormReturn, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { NewUserSchema } from "@/types/newUserSchema";
import { Checkbox } from "../ui/checkbox";

interface AdminNewUserRequestProps {
  isNewUser: boolean;
  form?: UseFormReturn<NewUserSchema>;
  newRequestData?: NewAdminRequestSchema & { requestId: string };
  setShowDialog?: (value: boolean) => void;
}
const AdminNewUserRequest = ({
  isNewUser,
  form,
  newRequestData,
  setShowDialog,
}: AdminNewUserRequestProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [serviceDays, setServiceDays] = useState<ServiceDay[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedService, setSelectedService] = useState<ServiceDay | null>(
    null
  );
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const newRequestForm = useForm<NewAdminRequestSchema>({
    resolver: zodResolver(newAdminRequestSchema),
    defaultValues: {
      userId: newRequestData?.userId || "",
      serviceDayId: newRequestData?.serviceDayId || "",
      addressId: newRequestData?.addressId || "",
      requestDate: newRequestData?.requestDate || undefined,
      isPickUp: newRequestData?.isPickUp ?? true,
      isDropOff: newRequestData?.isDropOff ?? false,
      notes: newRequestData?.notes || "",
    },
  });

  useEffect(() => {
    fetchServiceDays();
    fetchUsers();
    fetchAddresses();
  }, []);

  const serviceDayId = form ? form?.watch("serviceDayId") : "";
  useEffect(() => {
    if (serviceDayId && serviceDays.length > 0) {
      const service = serviceDays.find((s) => s.id === serviceDayId);
      setSelectedService(service || null);

      if (service) {
        // Set default request date to next occurrence of this service
        const nextDate = getNextServiceDate(service.dayOfWeek);
        // form.setValue("requestDate", nextDate.toISOString().split("T")[0]);
        form?.setValue("requestDate", nextDate);
      }
      // }
    }
  }, [serviceDayId, serviceDays]);

  const newServiceDayId = useWatch({
    control: newRequestForm.control,
    name: "serviceDayId",
  });

  useEffect(() => {
    if (newServiceDayId && serviceDays.length > 0) {
      const service = serviceDays.find((s) => s.id === newServiceDayId);
      setSelectedService(service || null);

      if (service) {
        // Set default request date to next occurrence of this service
        const nextDate = getNextServiceDate(service.dayOfWeek);
        // form.setValue("requestDate", nextDate.toISOString().split("T")[0]);
        newRequestForm.setValue("requestDate", nextDate);
      }
      // }
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

  const fetchServiceDays = async () => {
    try {
      const response = await fetch("/api/service-days");
      if (response.ok) {
        const data = await response.json();
        setServiceDays(data);
      }
    } catch (error) {
      console.error("Error fetching service days:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users`);

      if (response.ok) {
        const userData: User[] = await response.json();
        if (userData.length > 0) {
          setUsers(userData);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      // For demo purpose, create mock user
      const mockUser: User = {
        id: "mock-user",
        firstName: "mock",
        lastName: "user",
        email: "mock.user@church.com",
        phone: "(123) 456-7890",
        username: "mocky",
        role: "USER",
        status: "APPROVED",
        isActive: true,
        maxDistance: 50,
        emailVerified: null,
        phoneVerified: null,
        image: null,
        whatsappNumber: null,
        twoFactorEnabled: false,
        bannedAt: null,
        bannedBy: null,
        banReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        addresses: [
          {
            id: "mock-address",
            userId: session?.user?.id || "",
            street: "123 Main Street",
            city: "Toronto",
            province: "ON",
            postalCode: "M1M 1M1",
            country: "Canada",
            latitude: 43.6532,
            longitude: -79.3832,
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
      setUsers([mockUser]);
    }
  };
  const fetchAddresses = async () => {
    try {
      // For now, we'll fetch the user's default address
      // In a full implementation, you might have a user addresses API
      // This is a simplified version using the user's info
      if (selectedUser && selectedUser.id) {
        // const response = await fetch(`/api/users?id=${session.user.id}`);
        const response = await fetch(`/api/users`);
        if (response.ok) {
          const userData: Array<Pick<User, "id" | "addresses">> =
            await response.json();
          if (userData.length > 0) {
            setAddresses(
              userData.find((d) => d.id === selectedUser.id)?.addresses || []
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      // For demo, create a mock address if fetching fails
      const mockAddress: Address = {
        id: "mock-address",
        userId: session?.user?.id || "",
        street: "123 Main Street",
        city: "Toronto",
        province: "ON",
        postalCode: "M1M 1M1",
        country: "Canada",
        latitude: 43.6532,
        longitude: -79.3832,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setAddresses([mockAddress]);
    }
  };

  const handleSubmit = async (values: NewAdminRequestSchema) => {
    const validatedFields = newAdminRequestSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/pickup-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedFields.data),
      });
      if (response.ok) {
        toast.success("Pickup request created successfully!");
        router.push("/requests");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create request");
      }
    } catch (error) {
      console.error("Error creating request:", error);
      toast.error("An error occurred while creating the request");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: NewAdminRequestSchema) => {
    const validatedFields = newAdminRequestSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }
    console.log("Form Field: ", validatedFields.data);

    setLoading(true);

    try {
      const response = await fetch("/api/pickup-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: newRequestData?.requestId,
          ...validatedFields.data,
        }),
      });
      if (response.ok) {
        toast.success("Pickup request updated successfully!");
        setShowDialog?.(false);
        router.push("/requests");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update request");
      }
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("An error occurred while updating the request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isNewUser ? (
        <>
          {/* Service Selection */}
          <FormField
            control={form?.control}
            name="serviceDayId"
            render={({ field }) => {
              return (
                <FormItem className="space-y-2">
                  <FormLabel>Church Service</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceDays.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              {service.name} - {formatTime(service.time)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService && (
                    <FormDescription className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <span className="flex items-center space-x-2 text-sm text-blue-700">
                        <Clock className="h-4 w-4" />
                        <span>
                          Service starts at {formatTime(selectedService.time)}{" "}
                          every{" "}
                          {
                            [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                            ][selectedService.dayOfWeek]
                          }
                        </span>
                      </span>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Date Selection */}
          <FormField
            control={form?.control}
            name="requestDate"
            render={({ field }) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              return (
                <FormItem className="space-y-2">
                  <FormLabel>Service Date</FormLabel>
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
                  <FormDescription className="text-xs text-gray-500">
                    Requests must be made at least 1 hour before the service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Pickup and Dropoff Options */}
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PickUp Service */}
            <FormField
              control={form?.control}
              name="isPickUp"
              render={({ field }) => (
                <FormItem className="space-x-2">
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="isPickUp"
                      />
                    </FormControl>
                    <FormLabel>Pickup Service</FormLabel>
                  </div>
                  <FormMessage />
                  <FormDescription className="text-xs text-gray-500">
                    Select if you need a pickup service to the church
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* DropOff Service */}
            <FormField
              control={form?.control}
              name="isDropOff"
              render={({ field }) => (
                <FormItem className="space-x-2">
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="isDropOff"
                      />
                    </FormControl>
                    <FormLabel>DropOff Service</FormLabel>
                  </div>
                  <FormMessage />
                  <FormDescription className="text-xs text-gray-500">
                    Select if you need a drop off after service from church
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </>
      ) : (
        <div className="space-y-6">
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

          <Card>
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
                  className="space-y-6"
                >
                  {/* User Selection */}
                  <FormField
                    control={newRequestForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>On Behalf of</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          disabled={!!newRequestData}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select the user" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                <div className="flex items-center space-x-2">
                                  <User2 className="h-4 w-4" />
                                  <span>
                                    {user.firstName} {user.lastName}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedUser && (
                          <FormDescription className="mt-2 p-3 bg-blue-50 rounded-lg">
                            {!newRequestData ? (
                              <>
                                <span className="flex items-center space-x-2 text-sm text-gray-700">
                                  <UserCheck className="h-4 w-4" />
                                  <span>
                                    {selectedUser.firstName}{" "}
                                    {selectedUser.lastName}
                                  </span>
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  Please ensure this person you want to request
                                  a ride on behalf of
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500 mt-1">
                                You cannot change the user for this request
                              </span>
                            )}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Service Selection */}
                  <FormField
                    control={newRequestForm.control}
                    name="serviceDayId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Church Service</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceDays.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                <div className="flex items-center space-x-2">
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>
                                    {service.name} - {formatTime(service.time)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedService && (
                          <FormDescription className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <span className="flex items-center space-x-2 text-sm text-blue-700">
                              <Clock className="h-4 w-4" />
                              <span>
                                Service starts at{" "}
                                {formatTime(selectedService.time)} every{" "}
                                {
                                  [
                                    "Sunday",
                                    "Monday",
                                    "Tuesday",
                                    "Wednesday",
                                    "Thursday",
                                    "Friday",
                                    "Saturday",
                                  ][selectedService.dayOfWeek]
                                }
                              </span>
                            </span>
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date Selection */}
                  <FormField
                    control={newRequestForm.control}
                    name="requestDate"
                    render={({ field }) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      return (
                        <FormItem className="space-y-2">
                          <FormLabel>Service Date</FormLabel>
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
                                      new Date(
                                        formatDate(new Date(field.value))
                                      ),
                                      "PPP"
                                    )
                                  ) : (
                                    <span>Select a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                          <FormDescription className="text-xs text-gray-500">
                            Requests must be made at least 1 hour before the
                            service
                          </FormDescription>
                          <FormMessage />
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
                        <FormLabel>Pickup Address</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select pickup address" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedUser?.addresses?.map((address) => (
                              <SelectItem key={address.id} value={address.id}>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{formatAddress(address)}</span>
                                  {address.isDefault && (
                                    <span className="text-xs text-blue-600">
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
                            <span className="flex items-center space-x-2 text-sm text-gray-700">
                              <MapPin className="h-4 w-4" />
                              <span>{formatAddress(selectedAddress)}</span>
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              Please ensure this address is correct before
                              submitting your request
                            </span>
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Pickup and Dropoff Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PickUp Service */}
                    <FormField
                      control={newRequestForm.control}
                      name="isPickUp"
                      render={({ field }) => (
                        <FormItem className="space-x-2">
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="isPickUp"
                              />
                            </FormControl>
                            <FormLabel>Pickup Service</FormLabel>
                          </div>
                          <FormMessage />
                          <FormDescription className="text-xs text-gray-500">
                            Select if you need a pickup service to the church
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    {/* DropOff Service */}
                    <FormField
                      control={newRequestForm.control}
                      name="isDropOff"
                      render={({ field }) => (
                        <FormItem className="space-x-2">
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="isDropOff"
                              />
                            </FormControl>
                            <FormLabel>DropOff Service</FormLabel>
                          </div>
                          <FormMessage />
                          <FormDescription className="text-xs text-gray-500">
                            Select if you need a drop off after service from
                            church
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

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
                            className="resize-none"
                            rows={5}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Optional: Let your driver know about any special
                          requirements or instructions
                        </FormDescription>
                        <FormMessage />
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
                        • Pickup requests must be submitted latest 1 hour before
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
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        newRequestData ? (
                          "Updating Request..."
                        ) : (
                          "Creating Request..."
                        )
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
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
