"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Key, UserPlus2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { CustomPhoneInput } from "@/components/custom-phone-input";
import AdminNewUserRequest from "@/features/admin/components/admin-new-user-request";
import { AddressFields } from "@/features/auth/components/signup-form";
import { generateTempPassword } from "@/lib/utils";
import {
  newUserSchema,
  NewUserSchema,
} from "@/schemas/adminCreateNewUserSchema";

export const NewUserCreationForm = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const form = useForm<NewUserSchema>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      isLoginRequired: false,
      createPickUpRequest: false,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      province: "",
      postalCode: "",
      country: "",
      password: "",
      serviceDayId: "",
      isDropOff: false,
      isPickUp: true,
      isGroupRide: false,
      numberOfGroup: null,
      isRecurring: false,
      endDate: undefined,
      requestDate: undefined,
    },
  });

  // Watch the values needed for password generation
  const watchedValues = form.watch([
    "lastName",
    "phone",
    "isLoginRequired",
    "createPickUpRequest",
  ]);

  const [lastName, phone, isLoginRequired, createPickUpRequest] = watchedValues;

  // Function to generate temporary password
  const generatePassword = () => {
    if (!lastName || !phone) {
      toast.error("Please enter last name and phone number first");
      return;
    }

    const temp = generateTempPassword(lastName, phone);

    // Set the password in the form
    form.setValue("password", temp);
  };

  const onSubmit = async (values: NewUserSchema) => {
    const validatedFields = await newUserSchema.safeParseAsync(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);

    try {
      if (!values.createPickUpRequest) {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validatedFields.data),
        });
        if (response.ok) {
          toast.success("User Created Successfully!");
          router.push("/admin/users");
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to create user");
        }
      } else {
        const response = await fetch("/api/admin/users/pickup-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(validatedFields.data),
        });
        if (response.ok) {
          toast.success("User Created Successfully!");
          router.push("/admin/users");
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to create user");
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("An error occurred while creating user");
    } finally {
      setLoading(false);
    }
  };

  const isGroupRequest = form?.watch("isGroupRide");
  const isRecurringRequest = form?.watch("isRecurring");
  const formRequestDate = form?.watch("requestDate");

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">New User</h1>
          </div>
          <p className="text-primary mb-4">
            Create a new user{" "}
            {createPickUpRequest &&
              "and request transportation to church services"}
          </p>
        </div>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">User Details</CardTitle>
          <CardDescription>
            Please provide the details for the user you are creating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="firstName"
                          name="firstName"
                          placeholder="First name"
                          disabled={loading}
                        />
                      </FormControl>
                      <div className="min-h-[1.25rem]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="lastName"
                          name="lastName"
                          placeholder="Last name"
                          disabled={loading}
                        />
                      </FormControl>
                      <div className="min-h-[1.25rem]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Email & Phone number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="email"
                          name="email"
                          type="email"
                          placeholder="your.email@example.com"
                          disabled={loading}
                        />
                      </FormControl>
                      <div className="min-h-[1.25rem]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field, fieldState }) => {
                    return (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <CustomPhoneInput
                            placeholder="(123) 456-7890"
                            defaultCountry="CA"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={fieldState.error}
                            disabled={loading}
                          />
                        </FormControl>
                        <div className="min-h-[1.25rem]">
                          <FormMessage />
                        </div>
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* Login */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isLoginRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormLabel>Require Login</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            form.setValue("password", "");
                            field.onChange(checked);
                          }}
                        />
                      </FormControl>
                      <div className="min-h-[1.25rem]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                {isLoginRequired && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              id="password"
                              name="password"
                              type="password"
                              placeholder="********"
                              disabled={loading}
                              className="pr-32"
                            />
                            <Button
                              className="absolute right-1 top-1 h-7 px-3"
                              onClick={generatePassword}
                              disabled={loading}
                            >
                              <Key className="h-3 w-3 mr-1" />
                              Generate
                            </Button>
                          </div>
                        </FormControl>
                        <div className="min-h-[1.25rem]">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Address */}
              <AddressFields loading={loading} form={form} />

              {/* New Request */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <FormField
                    control={form.control}
                    name="createPickUpRequest"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormLabel>Make Request</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              form.setValue("serviceDayId", "");
                              form.setValue("requestDate", undefined);
                              field.onChange(checked);
                            }}
                          />
                        </FormControl>
                        <div className="min-h-[1.25rem]">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                {/* New request Form */}
                {createPickUpRequest && (
                  <AdminNewUserRequest
                    isNewUser={true}
                    form={form}
                    isGroupRequest={isGroupRequest}
                    isRecurringRequest={isRecurringRequest}
                    formRequestDate={formRequestDate}
                  />
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <Link href="/admin/users">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                {createPickUpRequest ? (
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      "Creating User and Request..."
                    ) : (
                      <>
                        <UserPlus2Icon className="mr-2 h-4 w-4" />
                        Create New User and Request
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading || !form.formState.isDirty}
                  >
                    {loading ? (
                      "Creating User..."
                    ) : (
                      <>
                        <UserPlus2Icon className="mr-2 h-4 w-4" />
                        Create New User
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
