"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import CustomPhoneInput from "@/components/custom-phone-input";
import { useSession } from "@/lib/auth-client";
import { PROVINCES } from "@/lib/types";
import {
  ProfileAddressSchema,
  profileAddressSchema,
  profileContactSchema,
  ProfileContactSchema,
} from "@/schemas/authSchemas";

interface CompletionStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface OauthCompletionModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const OauthCompletionModal = ({
  isOpen: externalOpen,
  onOpenChange,
}: OauthCompletionModalProps) => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  // const [open, setOpen] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Use external control if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Form for contact info
  const contactForm = useForm<ProfileContactSchema>({
    resolver: zodResolver(profileContactSchema),
    defaultValues: {
      phone: "",
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
      country: "Canada",
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

  useEffect(() => {
    // Only auto-open if not externally controlled
    if (externalOpen === undefined) {
      // Show modal if user needs to complete profile
      if (
        // session?.user?.needsCompletion &&
        // session.user.isOAuthSignup &&
        // status === "authenticated"
        !isPending
      ) {
        setInternalOpen(true);
      }
    }
  }, [session, isPending, externalOpen]);

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
    if (!isContactValid || !isAddressValid) return;
    setLoading(true);
    try {
      // Get Values
      const profileData = contactForm.getValues();
      const addressData = addressForm.getValues();

      // Update profile
      const profileResponse = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: profileData.phone,
          whatsappNumber: profileData.whatsappNumber || null,
        }),
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to update profile");
      }

      // Add address
      const addressResponse = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressData),
      });

      if (!addressResponse.ok) {
        throw new Error("Failed to add address");
      }

      // Track OAuth completion and user registration
      if (session?.user.id) {
        try {
          await fetch("/api/analytics/oauth-completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id }),
          });
        } catch (error) {
          console.error("Failed to track OAuth completion:", error);
        }
      }

      setOpen(false);
      toast.success(
        "Profile completed successfully! Your account is pending admin approval."
      );
      router.push("/dashboard");
    } catch (error) {
      console.error("Completion error:", error);
      toast.error("Failed to complete profile setup");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Complete Your Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
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
          <Card>
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
                      name="phone"
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
                              disabled={loading}
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
                              disabled={loading}
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
                            defaultValue={field.value}
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
                    <FormField
                      control={addressForm.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              name="street"
                              onChange={(e) => field.onChange(e)}
                              placeholder="123 Main Street"
                            />
                          </FormControl>
                          <div className="min-h-[1.25rem]">
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* City & Province */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* City */}
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                name="city"
                                onChange={(e) => field.onChange(e)}
                                placeholder="Toronto"
                              />
                            </FormControl>
                            <div className="min-h-[1.25rem]">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Province */}
                      <FormField
                        control={addressForm.control}
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
                            <div className="min-h-[1.25rem]">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Postal Code & Country */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Postal Code */}
                      <FormField
                        control={addressForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                name="postalCode"
                                placeholder="M5H 2N2"
                                disabled={loading}
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                              />
                            </FormControl>
                            <div className="min-h-[1.25rem]">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Country */}
                      <FormField
                        control={addressForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                name="country"
                                placeholder="Canada"
                                disabled={loading}
                                onChange={(e) => field.onChange(e)}
                              />
                            </FormControl>
                            <div className="min-h-[1.25rem]">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

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
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? "Completing..." : "Complete Setup"}
                </Button>
              ) : (
                <Button onClick={handleNext}>Next</Button>
              )}
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">
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
      </DialogContent>
    </Dialog>
  );
};
