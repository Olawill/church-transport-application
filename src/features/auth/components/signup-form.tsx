"use client";

import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronsUpDown,
  Eye,
  EyeClosed,
  Loader2Icon,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FieldValues,
  Path,
  PathValue,
  useForm,
  UseFormReturn,
} from "react-hook-form";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

import { CustomFormLabel } from "@/components/custom-form-label";
import { CustomPhoneInput } from "@/components/custom-phone-input";

import { signupSchema, SignupSchema } from "@/schemas/authSchemas";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { passwordStrength } from "../lib/utils";
import { PasswordStrength } from "./password-strength";

interface AddressFormFields extends FieldValues {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface AddressFieldsProps<T extends AddressFormFields> {
  form: UseFormReturn<T>;
  loading: boolean;
}

export type PasswordScore = {
  score: number;
  strength: "weak" | "good" | "strong";
  errors: string[];
};

export const SignupForm = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [strength, setStrength] = useState<PasswordScore>({
    score: 0,
    strength: "weak",
    errors: [],
  });

  const sendWelcomeMessage = useMutation(
    trpc.emails.sendMail.mutationOptions({
      onSuccess: () => {
        toast.success("Welcome email sent successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send welcome message");
      },
    })
  );

  const register = useMutation(
    trpc.auth.register.mutationOptions({
      onSuccess: async ({ user }) => {
        toast.success(
          "Registration successful! Please wait for admin approval to access your account."
        );
        await sendWelcomeMessage.mutateAsync({
          to: user.email,
          type: "welcome",
          name: user.name,
        });
        router.push("/login");
      },
      onError: (error) => {
        toast.error(
          error.message || "Registration failed. Please try again later."
        );
      },
    })
  );

  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      whatsappNumber: "",
      street: "",
      city: "",
      province: "",
      postalCode: "",
      country: "",
    },
  });

  const phoneNumber = form.watch("phoneNumber");

  const onSubmit = async (values: SignupSchema) => {
    // Validate the form data
    const validatedFields = signupSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please check your information. It cannot be validated");
      return;
    }

    try {
      register.mutate(validatedFields.data);
    } catch {
      toast.error("An error occurred during registration");
    }
  };

  const [currentPassword] = useDebounce(form.watch("password"), 300);
  const currentConfirmPassword = form.watch("confirmPassword");
  const loading = register.isPending;

  useEffect(() => {
    const { strength, errors } = passwordStrength(currentPassword);

    if (strength === "weak") {
      setStrength({ score: 50, strength, errors });
    }

    if (strength === "good") {
      setStrength({ score: 75, strength, errors });
    }

    if (strength === "strong") {
      setStrength({ score: 100, strength, errors });
    }
  }, [currentPassword]);

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold">Join Our Community</CardTitle>
        <CardDescription>
          Create an account to request pickup services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <CustomFormLabel title="First Name" />
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
                    <CustomFormLabel title="Last Name" />
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

            {/* Email & Phone Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <CustomFormLabel title="Email Address" />
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
                name="phoneNumber"
                render={({ field, fieldState }) => {
                  return (
                    <FormItem>
                      <CustomFormLabel title="Phone Number" />
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

            {/* whatsApp Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <Label>Use Phone Number for whatsApp?</Label>
                <Switch
                  disabled={!phoneNumber}
                  onCheckedChange={(checked) =>
                    form.setValue("whatsappNumber", checked ? phoneNumber : "")
                  }
                  // className="disabled:cursor-not-allowed"
                />
              </div>

              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field, fieldState }) => {
                  return (
                    <FormItem>
                      <FormLabel>whatsApp Number</FormLabel>
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

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <CustomFormLabel title="Password" />
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="**************"
                          disabled={loading}
                        />
                        <Button
                          variant="ghost"
                          type="button"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading || !form.watch("password")}
                        >
                          {showPassword ? (
                            <Eye className="size-4" />
                          ) : (
                            <EyeClosed className="size-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>

                    {/* Password strength (mobile only) */}
                    {currentPassword && (
                      <div className="block md:hidden mt-2">
                        <PasswordStrength strength={strength} />
                      </div>
                    )}

                    <div className="min-h-[1.25rem]">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <CustomFormLabel title="Confirm Password" />
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="**************"
                          disabled={loading}
                        />

                        <Button
                          variant="ghost"
                          type="button"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-600"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={loading || !currentConfirmPassword}
                        >
                          {showConfirmPassword ? (
                            <Eye className="size-4" />
                          ) : (
                            <EyeClosed className="size-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <div className="min-h-[1.25rem]">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Password strength under both fields on large screens */}
              {currentPassword && (
                <div className="hidden md:block col-span-2">
                  <PasswordStrength strength={strength} />
                </div>
              )}
            </div>

            {/* Address */}
            <AddressFields loading={loading} form={form} />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const AddressFields = <T extends AddressFormFields>({
  form,
  loading,
}: AddressFieldsProps<T>) => {
  const trpc = useTRPC();
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const selectedCountry = form.watch("country" as Path<T>);
  const selectedState = form.watch("province" as Path<T>);

  // Track previous country to reset state/city only if country actually changed
  const prevCountryRef = useRef<string | undefined>(undefined);
  const prevStateRef = useRef<string | undefined>(undefined);

  // Fetch countries (will use server-prefetched data)
  const { data: countriesByContinent } = useSuspenseQuery(
    trpc.places.countries.queryOptions(undefined, {
      staleTime: Infinity, // Countries never change
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })
  );

  // Fetch states for selected country
  const { data: statesData = [], isLoading: statesLoading } = useQuery(
    trpc.places.states.queryOptions(
      { countryCode: selectedCountry },
      {
        enabled: !!selectedCountry,
        staleTime: 10 * 60 * 1000, // 10 minutes
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        // Keep previous data while fetching new data to prevent flickering
        placeholderData: (previousData) => previousData,
      }
    )
  );

  // Fetch cities for selected state
  const { data: citiesData = [], isLoading: citiesLoading } = useQuery(
    trpc.places.cities.queryOptions(
      {
        countryCode: selectedCountry,
        stateCode: selectedState,
      },
      {
        enabled: !!selectedCountry && !!selectedState,
        staleTime: 10 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        // Keep previous data while fetching new data
        placeholderData: (previousData) => previousData,
      }
    )
  );

  // Memoize the data to prevent unnecessary re-renders
  const states = useMemo(() => statesData || [], [statesData]);
  const cities = useMemo(() => citiesData || [], [citiesData]);

  // Set Canada as default on mount
  useEffect(() => {
    const { country, province, city, postalCode } = form.getValues();

    if (!country) {
      form.setValue("country" as Path<T>, "CA" as PathValue<T, Path<T>>);
    }

    if (province) {
      form.setValue("province" as Path<T>, province as PathValue<T, Path<T>>);
    }

    if (city) {
      form.setValue("city" as Path<T>, city as PathValue<T, Path<T>>);
    }

    if (postalCode) {
      form.setValue(
        "postalCode" as Path<T>,
        postalCode as PathValue<T, Path<T>>
      );
    }
  }, [form]);

  // Reset state and city when country changes
  useEffect(() => {
    // Only reset if we actually changed countries
    const prevCountry = prevCountryRef.current;

    if (prevCountry && selectedCountry && prevCountry !== selectedCountry) {
      form.setValue("province" as Path<T>, "" as PathValue<T, Path<T>>);
      form.setValue("city" as Path<T>, "" as PathValue<T, Path<T>>);
    }
    prevCountryRef.current = selectedCountry;
  }, [selectedCountry, form]);

  // Reset city when state changes
  useEffect(() => {
    const prevState = prevStateRef.current;

    if (prevState && selectedState && prevState !== selectedState) {
      form.setValue("city" as Path<T>, "" as PathValue<T, Path<T>>);
    }
    prevStateRef.current = selectedState;
  }, [selectedState, form]);

  // Get all countries in a flat array for easier searching
  const allCountries = useMemo(() => {
    if (!countriesByContinent) return [];

    return Object.entries(countriesByContinent).flatMap(
      ([continent, countries]) =>
        countries.map((country) => ({ ...country, continent }))
    );
  }, [countriesByContinent]);

  // Determine if we should show combobox or text input
  const showStateCombobox = states.length > 0;
  const showCityCombobox = cities.length > 0;

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold">Address Information</h3>

      {/* Street Address */}
      <FormField
        control={form.control}
        name={"street" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <CustomFormLabel title="Street Address" />
            <FormControl>
              <Input
                {...field}
                id="street"
                name="street"
                placeholder="123 Main Street"
                disabled={loading}
              />
            </FormControl>
            <div className="min-h-[1.25rem]">
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country Combobox */}
        <FormField
          control={form.control}
          name={"country" as Path<T>}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <CustomFormLabel title="Country" />
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={countryOpen}
                      disabled={loading}
                      className={cn(
                        "justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        <span className="flex items-center gap-2">
                          <span>
                            {
                              allCountries.find((c) => c.value === field.value)
                                ?.flag
                            }
                          </span>
                          <span>
                            {
                              allCountries.find((c) => c.value === field.value)
                                ?.label
                            }
                          </span>
                        </span>
                      ) : (
                        "Select country"
                      )}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      {Object.entries(countriesByContinent ?? []).map(
                        ([continent, countries]) => (
                          <CommandGroup key={continent} heading={continent}>
                            {countries.map((country) => (
                              <CommandItem
                                key={country.value}
                                value={country.value}
                                onSelect={(value) => {
                                  form.setValue(
                                    "country" as Path<T>,
                                    value as PathValue<T, Path<T>>
                                  );
                                  setCountryOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 size-4",
                                    field.value === country.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.label}</span>
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* State/Province Combobox - Only show if country has states */}
        <FormField
          control={form.control}
          name={"province" as Path<T>}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <CustomFormLabel title="Province/State" />
              {showStateCombobox ? (
                <Popover open={stateOpen} onOpenChange={setStateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={stateOpen}
                        disabled={loading || !selectedCountry || statesLoading}
                        className={cn(
                          "justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? states.find((s) => s.value === field.value)?.label
                          : "Select province/state"}
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search province/state..." />
                      <CommandList>
                        <CommandEmpty>No province/state found.</CommandEmpty>
                        <CommandGroup>
                          {states.map((state) => (
                            <CommandItem
                              key={state.value}
                              value={state.value}
                              onSelect={(value) => {
                                form.setValue(
                                  "province" as Path<T>,
                                  value as PathValue<T, Path<T>>
                                );
                                setStateOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  field.value === state.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {state.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <FormControl>
                  <Input
                    placeholder="Enter province/state"
                    {...field}
                    disabled={loading || !selectedCountry}
                  />
                </FormControl>
              )}
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* City Combobox - Only show if state has cities */}
        <FormField
          control={form.control}
          name={"city" as Path<T>}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <CustomFormLabel title="City" />
              {showCityCombobox ? (
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={cityOpen}
                        disabled={loading || !selectedState || citiesLoading}
                        className={cn(
                          "justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value || "Select city"}
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search city..." />
                      <CommandList>
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandGroup>
                          {cities.map((city) => (
                            <CommandItem
                              key={city.value}
                              value={city.value}
                              onSelect={(value) => {
                                form.setValue(
                                  "city" as Path<T>,
                                  value as PathValue<T, Path<T>>
                                );
                                setCityOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  field.value === city.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {city.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <FormControl>
                  <Input
                    placeholder="Enter city"
                    {...field}
                    disabled={loading || !selectedCountry}
                  />
                </FormControl>
              )}
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Postal Code */}
        <FormField
          control={form.control}
          name={"postalCode" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <CustomFormLabel title="Postal Code" />
              <FormControl>
                <Input placeholder="A1A 1A1" {...field} disabled={loading} />
              </FormControl>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export const SignupFormSkeleton = () => {
  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold">Join Our Community</CardTitle>
        <CardDescription>
          Create an account to request pickup services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="size-24" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
              <div className="min-h-[1.25rem]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="size-24" />
              <Skeleton className="h-10 w-full" />
              <div className="min-h-[1.25rem]" />
            </div>
          </div>

          {/* Email & Phone Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <div className="min-h-[1.25rem]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
              <div className="min-h-[1.25rem]" />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-11 rounded-full" /> {/* Switch */}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <div className="min-h-[1.25rem]" />
            </div>
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
              <div className="min-h-[1.25rem]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-full" />
              <div className="min-h-[1.25rem]" />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" /> {/* Section Title */}
            {/* Street Address */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <div className="min-h-[1.25rem]" />
            </div>
            {/* Country & Province */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
                <div className="min-h-[1.25rem]" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
                <div className="min-h-[1.25rem]" />
              </div>
            </div>
            {/* City & Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
                <div className="min-h-[1.25rem]" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <div className="min-h-[1.25rem]" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Sign in link */}
        <div className="mt-6 text-center">
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </CardContent>
    </Card>
  );
};
