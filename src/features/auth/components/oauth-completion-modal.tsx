"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircleIcon,
  Loader2Icon,
  MapPinIcon,
  PhoneIcon,
} from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { CustomPhoneInput } from "@/components/custom-phone-input";
import { useSession } from "@/lib/auth-client";
import {
  ProfileAddressValues,
  profileAddressSchema,
  profileContactSchema,
  ProfileContactValues,
} from "@/schemas/authSchemas";
import { useTRPC } from "@/trpc/client";
import { CustomFormLabel } from "@/components/custom-form-label";
import { AddressFields } from "./signup-form";

interface CompletionStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const OauthCompletionModal = () => {
  const { data: session, isPending } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);

  // Mutations
  const updateUserProfile = useMutation(
    trpc.userProfile.updateContact.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.auth.session.queryOptions());
        toast.success(
          "Your contact information has been updated successfully!",
        );
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update contact information");
      },
    }),
  );

  const createUserAddress = useMutation(
    trpc.userAddresses.createUserAddress.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.auth.session.queryOptions());
        toast.success(
          "Congratulations, your first address has been added successfully!",
        );
      },
      onError: (error) => {
        toast.error(error.message || "Failed to add address");
      },
    }),
  );

  // Form for contact info
  const contactForm = useForm<ProfileContactValues>({
    resolver: zodResolver(profileContactSchema),
    defaultValues: {
      phoneNumber: "",
      whatsappNumber: "",
    },
  });

  // Form for address info
  const addressForm = useForm<ProfileAddressValues>({
    resolver: zodResolver(profileAddressSchema),
    defaultValues: {
      name: "Home",
      street: "",
      city: "",
      province: "",
      postalCode: "",
      country: "CA",
    },
  });

  const steps: CompletionStep[] = [
    {
      id: "contact",
      title: "Contact Information",
      description: "Add your phone number for transportation coordination",
      completed: false,
    },
    {
      id: "address",
      title: "Pickup Address",
      description: "Add your primary pickup location",
      completed: false,
    },
  ];

  const handleNext = async () => {
    if (currentStep === 0) {
      const isValid = await contactForm.trigger();
      if (isValid) {
        setCurrentStep(1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    const isContactValid = await contactForm.trigger();
    const isAddressValid = await addressForm.trigger();

    if (!isContactValid || !isAddressValid) {
      toast.error("Please fill in all required field");
      return;
    }

    if (!session?.user) {
      toast.error("You are not authorized. Please sign in");
      return redirect("/login");
    }

    try {
      // Get Values
      const profileData = contactForm.getValues();
      const addressData = addressForm.getValues();

      // Update profile
      const profile = await updateUserProfile.mutateAsync(profileData);

      if (!profile.success) {
        toast.error("Failed to update profile");
        return;
      }

      // Add address
      await createUserAddress.mutateAsync({
        ...addressData,
        isProfileCompletion: true,
      });

      toast.success("Profile completed successfully.");

      window.location.href = "/pending-approval";
    } catch (error) {
      console.error("Completion error:", error);
      toast.error("Failed to complete profile setup");
    }
  };

  const isLoading = updateUserProfile.isPending || createUserAddress.isPending;

  if (isPending) {
    return <CompleteProfileSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Complete Your Profile</CardTitle>
        <CardDescription>
          Enter your contact information and ride address to complete your
          onboarding.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-start">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors ${
                    index <= currentStep
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 text-gray-400"
                  } `}
                >
                  {index < currentStep ? (
                    <CheckCircleIcon className="size-5" />
                  ) : (
                    <span className="font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-24 transition-colors ${index < currentStep ? "bg-blue-600" : "bg-gray-300"} `}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {currentStep === 0 && <PhoneIcon className="mr-2 size-5" />}
                {currentStep === 1 && <MapPinIcon className="mr-2 size-5" />}
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription>
                {steps[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep === 0 && (
                <Form {...contactForm}>
                  <form className="space-y-4">
                    {/* Phone Number */}
                    <FormField
                      control={contactForm.control}
                      name="phoneNumber"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <CustomFormLabel title="Phone Number" />
                          <FormControl>
                            <CustomPhoneInput
                              placeholder="+1 (555) 123-4567"
                              defaultCountry="CA"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              error={fieldState.error}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            <span className="mt-1 text-sm text-gray-500">
                              Required for transportation team to contact you
                            </span>
                          </FormDescription>
                          <div className="min-h-[1.25rem]">
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    {/* WhatsApp Number */}
                    <FormField
                      control={contactForm.control}
                      name="whatsappNumber"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Number</FormLabel>
                          <FormControl>
                            <CustomPhoneInput
                              placeholder="+1 (555) 123-4567"
                              defaultCountry="CA"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              error={fieldState.error}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <div className="min-h-[1.25rem]">
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}

              {currentStep === 1 && (
                <Form {...addressForm}>
                  <form className="space-y-4">
                    {/* Address Name */}
                    <FormField
                      control={addressForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Address Name</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select address type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Home">Home</SelectItem>
                              <SelectItem value="Work">Work</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="min-h-[1.25rem]">
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Street Address */}
                    <AddressFields form={addressForm} loading={isLoading} />

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This will be your primary pickup
                        location. You can add more addresses and change your
                        default location later in your profile settings.
                      </p>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            <div className="flex space-x-2">
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleComplete} disabled={isLoading}>
                  {isLoading && <Loader2Icon className="size-4 animate-spin" />}
                  {isLoading ? "Completing..." : "Complete Setup"}
                </Button>
              ) : (
                <Button onClick={handleNext}>Next</Button>
              )}
            </div>
          </div>

          {/* Welcome Message */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <h3 className="mb-2 font-medium text-green-800">
              Welcome to Church Transportation!
            </h3>
            <p className="text-sm text-green-700">
              Thank you for joining our transportation service. Once you
              complete this setup, your account will be reviewed by an
              administrator and you&apos;ll be able to request pickups for
              church services.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CompleteProfileSkeleton = () => {
  return (
    <Card className="w-full lg:min-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">
          <Skeleton className="h-7 w-64" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <div className="space-y-6">
          {/* Progress Steps Skeleton */}
          <div className="flex items-center justify-start">
            {[1, 2].map((step, index) => (
              <div key={step} className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                {index < 1 && <Skeleton className="mx-2 h-0.5 w-24" />}
              </div>
            ))}
          </div>

          {/* Current Step Content Skeleton */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Skeleton className="mr-2 h-5 w-5 rounded" />
                <Skeleton className="h-6 w-48" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="mt-2 h-4 w-full" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Form Fields Skeleton */}
              <div className="space-y-4">
                {/* Field 1 */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-64" />
                </div>

                {/* Field 2 */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons Skeleton */}
          <div className="flex justify-between">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Welcome Message Skeleton */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <Skeleton className="mb-2 h-5 w-48" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
