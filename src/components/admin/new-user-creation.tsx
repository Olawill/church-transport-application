"use client";
import React, { useState } from "react";
import { ArrowLeft, Key, UserPlus2Icon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { newUserSchema, NewUserSchema } from "@/types/newUserSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { PROVINCES } from "@/lib/types";
import CustomPhoneInput from "@/components/custom-phone-input";
import { toast } from "sonner";
import { generateTempPassword } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import AdminNewUserRequest from "@/components/admin/admin-new-user-request";

const NewUserCreationForm = () => {
  //   const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRequest, setIsRequest] = useState(false);

  // Ref to access the AdminNewUserRequest component's form
  //   const requestFormRef = useRef<any>(null);

  const form = useForm<NewUserSchema>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      province: "",
      postalCode: "",
      isLoginRequired: false,
      password: "",
    },
  });

  // Watch the values needed for password generation
  const watchedValues = form.watch(["lastName", "phone", "isLoginRequired"]);

  const [lastName, phone, isLoginRequired] = watchedValues;

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
    setLoading(true);
    try {
      console.log("Submitting new user with values", { values });
    } catch (error) {
      console.error("Error submitting form", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">New User</h1>
          </div>
          <p className="text-primary">
            Create a new user{" "}
            {isRequest && "and request transportation to church services"}
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
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                      <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

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
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Address Information
                </h3>

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="street"
                          name="street"
                          placeholder="123 Main Street"
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="city"
                            name="city"
                            placeholder="Calgary"
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Province</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              disabled={loading}
                              className="w-full"
                            >
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Canada</SelectLabel>
                              {PROVINCES.map((province) => (
                                <SelectItem value={province} key={province}>
                                  {province}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            id="postalCode"
                            name="postalCode"
                            placeholder="T1A 0A6"
                            disabled={loading}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* New Request */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="newRequest"
                    checked={isRequest}
                    onCheckedChange={() => setIsRequest(!isRequest)}
                  />
                  <Label htmlFor="newRequest">Make Request For User</Label>
                </div>
                {/* New request Form */}
                {isRequest && <AdminNewUserRequest isNewUser={true} />}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <Link href="/admin/users">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                {isRequest ? (
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
                  <Button type="submit" disabled={loading}>
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

export default NewUserCreationForm;
