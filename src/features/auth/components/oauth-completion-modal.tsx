"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Loader2Icon, MapPin, Phone } from "lucide-react";
import { redirect } from "next/navigation";
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

import { CustomFormLabel } from "@/components/custom-form-label";
import { CustomPhoneInput } from "@/components/custom-phone-input";
import { useSession } from "@/lib/auth-client";
import {
  ProfileAddressSchema,
  profileAddressSchema,
  profileContactSchema,
  ProfileContactSchema,
} from "@/schemas/authSchemas";
import { useTRPC } from "@/trpc/client";
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

  const updateUserProfile = useMutation(
    trpc.userProfile.updateContact.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.auth.session.queryOptions());
        toast.success("Your contact information has been updated");
      },
    })
  );

  const createUserAddress = useMutation(
    trpc.userAddresses.createUserAddress.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.auth.session.queryOptions());
        toast.success(
          "Congratulations, your first address been added successfully"
        );
      },
      onError: (error) => {
        toast.error(error.message || "Failed to add address");
      },
    })
  );

  // Form for contact info
  const contactForm = useForm<ProfileContactSchema>({
    resolver: zodResolver(profileContactSchema),
    defaultValues: {
      phoneNumber: "",
      whatsappNumber: "",
    },
  });

  // Form for address info
  const addressForm = useForm<ProfileAddressSchema>({
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
      toast.error("Please fill in all required fields");
      return;
    }

    if (!session?.user) {
      toast.error("You logged in");
      redirect("/login");
      return;
    }

    try {
      // Get Values
      const profileData = contactForm.getValues();
      const addressData = addressForm.getValues();

      const profile = await updateUserProfile.mutateAsync(profileData);

      if (!profile.success) {
        toast.error("Failed to update profile");
        return;
      }

      await createUserAddress.mutateAsync({
        ...addressData,
        isProfileCompletion: true,
      });

      toast.success("Profile completed successfully!");

      // Redirect to pending approval page
      window.location.href = "/pending-approval";
    } catch (error) {
      console.error("Completion error:", error);
      toast.error("Failed to complete profile setup");
    }
  };

  const isLoading = updateUserProfile.isPending || createUserAddress.isPending;

  if (isPending) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Complete Your Profile</CardTitle>
        <CardDescription>
          Enter your contact information and ride address to complete your
          onboarding
        </CardDescription>
      </CardHeader>
      <CardContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-start">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                  ${
                    index <= currentStep
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 text-gray-400"
                  }
                `}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                    w-24 h-0.5 mx-2 transition-colors
                    ${index < currentStep ? "bg-blue-600" : "bg-gray-300"}
                  `}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center">
                {currentStep === 0 && <Phone className="w-5 h-5 mr-2" />}
                {currentStep === 1 && <MapPin className="w-5 h-5 mr-2" />}
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
                          <FormLabel>
                            Phone Number
                            <span className="text-red-500"> *</span>
                          </FormLabel>
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
                            <span className="text-sm text-gray-500 mt-1">
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
                          <CustomFormLabel title="Address Name" />
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoading}
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

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">
              Welcome to ActsOnWheels!
            </h3>
            <p className="text-sm text-green-700">
              Thank you for joining our transportation service. Once you
              complete this setup, your account will be reviewed by an
              administrator and you&apos;ll be able to request rides for church
              services.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
