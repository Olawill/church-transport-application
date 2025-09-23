"use client";

import { CheckCircle, MapPin, Phone } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompletionStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export const OauthCompletionModal = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    phone: "",
    whatsappNumber: "",
  });

  const [addressData, setAddressData] = useState({
    name: "Home",
    street: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
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
    // Show modal if user needs to complete profile
    if (
      session?.user?.needsCompletion &&
      session.user.isOAuthSignup &&
      status === "authenticated"
    ) {
      setOpen(true);
    }
  }, [session, status]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Update profile information
      const profileFormData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        if (value) profileFormData.append(key, value);
      });

      const profileResponse = await fetch("/api/user/profile", {
        method: "PUT",
        body: profileFormData,
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
      router.push("/tenant/dashboard");
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

  const isStepValid = () => {
    if (currentStep === 0) {
      return profileData.phone.trim().length > 0;
    }
    if (currentStep === 1) {
      return (
        addressData.street.trim().length > 0 &&
        addressData.city.trim().length > 0 &&
        addressData.province.trim().length > 0 &&
        addressData.postalCode.trim().length > 0
      );
    }
    return false;
  };

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
                <>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Required for transportation team to contact you
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={profileData.whatsappNumber}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          whatsappNumber: e.target.value,
                        }))
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      For WhatsApp notifications (can be same as phone number)
                    </p>
                  </div>
                </>
              )}

              {currentStep === 1 && (
                <>
                  <div>
                    <Label htmlFor="addressName">Address Name</Label>
                    <Select
                      value={addressData.name}
                      onValueChange={(value) =>
                        setAddressData((prev) => ({ ...prev, name: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Work">Work</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      value={addressData.street}
                      onChange={(e) =>
                        setAddressData((prev) => ({
                          ...prev,
                          street: e.target.value,
                        }))
                      }
                      placeholder="123 Main Street"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={addressData.city}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        placeholder="Toronto"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Province *</Label>
                      <Input
                        id="province"
                        value={addressData.province}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            province: e.target.value,
                          }))
                        }
                        placeholder="ON"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={addressData.postalCode}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            postalCode: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="M5H 2N2"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={addressData.country}
                        onChange={(e) =>
                          setAddressData((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        placeholder="Canada"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This will be your primary pickup
                      location. You can add more addresses and change your
                      default location later in your profile settings.
                    </p>
                  </div>
                </>
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
                <Button
                  onClick={handleComplete}
                  disabled={!isStepValid() || loading}
                >
                  {loading ? "Completing..." : "Complete Setup"}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!isStepValid()}>
                  Next
                </Button>
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
