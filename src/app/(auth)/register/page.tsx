"use client";

import { CarBack } from "@/components/icons/car";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const organizationTypes = [
  { value: "CHURCH", label: "Church" },
  { value: "NONPROFIT", label: "Non-Profit Organization" },
  { value: "EDUCATIONAL", label: "Educational Institution" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "OTHER", label: "Other" },
];

const countries = [
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
];

const plans = [
  {
    name: "STARTER",
    displayName: "Starter",
    price: 29,
    description: "Perfect for small organizations",
    features: ["Up to 100 users", "Basic features", "Email support"],
    recommended: false,
  },
  {
    name: "PROFESSIONAL",
    displayName: "Professional",
    price: 79,
    description: "Best for growing organizations",
    features: [
      "Up to 500 users",
      "Advanced features",
      "Priority support",
      "Custom branding",
    ],
    recommended: true,
  },
  {
    name: "ENTERPRISE",
    displayName: "Enterprise",
    price: 199,
    description: "For large organizations",
    features: [
      "Unlimited users",
      "All features",
      "24/7 support",
      "White-label",
    ],
    recommended: false,
  },
];

interface FormData {
  // Organization details
  organizationName: string;
  slug: string;
  type: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;

  // Owner details
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;

  // Registration details
  selectedPlan: string;
  selectedCountries: string[];
  referralSource: string;

  // Legal
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    organizationName: "",
    slug: "",
    type: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
    ownerPhone: "",
    selectedPlan: "PROFESSIONAL",
    selectedCountries: [],
    referralSource: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from organization name
    if (field === "organizationName") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 30);
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.organizationName &&
          formData.slug &&
          formData.type &&
          formData.contactEmail
        );
      case 2:
        return !!(
          formData.ownerFirstName &&
          formData.ownerLastName &&
          formData.ownerEmail
        );
      case 3:
        return !!(
          formData.selectedPlan && formData.selectedCountries.length > 0
        );
      case 4:
        return formData.acceptTerms && formData.acceptPrivacy;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error("Please complete all required fields and accept the terms");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/public/register-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Registration submitted successfully! We'll review your application and get back to you soon."
        );
        router.push(
          `/registration-success?email=${encodeURIComponent(formData.ownerEmail)}` as Route
        );
      } else {
        toast.error(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCountry = (countryCode: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCountries: prev.selectedCountries.includes(countryCode)
        ? prev.selectedCountries.filter((c) => c !== countryCode)
        : [...prev.selectedCountries, countryCode],
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              step <= currentStep
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-gray-300 text-gray-400"
            }`}
          >
            {step < currentStep ? <Check className="h-5 w-5" /> : step}
          </div>
          {step < 4 && (
            <div
              className={`w-16 h-1 mx-2 ${
                step < currentStep ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <CardTitle>Tell us about your organization</CardTitle>
        <CardDescription>
          Let&apos;s start with some basic information about your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="organizationName">Organization Name *</Label>
            <Input
              id="organizationName"
              value={formData.organizationName}
              onChange={(e) =>
                updateFormData("organizationName", e.target.value)
              }
              placeholder="e.g., Grace Community Church"
            />
          </div>
          <div>
            <Label htmlFor="slug">Subdomain *</Label>
            <div className="flex">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateFormData("slug", e.target.value)}
                placeholder="grace-community"
              />
              <span className="flex items-center px-3 bg-gray-100 border border-l-0 rounded-r text-gray-600">
                .actsOnWheels.com
              </span>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="type">Organization Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => updateFormData("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select organization type" />
            </SelectTrigger>
            <SelectContent>
              {organizationTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData("description", e.target.value)}
            placeholder="Brief description of your organization"
            rows={3}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactEmail">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => updateFormData("contactEmail", e.target.value)}
              placeholder="contact@organization.com"
            />
          </div>
          <div>
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => updateFormData("contactPhone", e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => updateFormData("website", e.target.value)}
            placeholder="https://www.organization.com"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-6 w-6 text-white" />
        </div>
        <CardTitle>Organization Owner Details</CardTitle>
        <CardDescription>
          Who will be the primary administrator for your organization?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ownerFirstName">First Name *</Label>
            <Input
              id="ownerFirstName"
              value={formData.ownerFirstName}
              onChange={(e) => updateFormData("ownerFirstName", e.target.value)}
              placeholder="John"
            />
          </div>
          <div>
            <Label htmlFor="ownerLastName">Last Name *</Label>
            <Input
              id="ownerLastName"
              value={formData.ownerLastName}
              onChange={(e) => updateFormData("ownerLastName", e.target.value)}
              placeholder="Smith"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ownerEmail">Email Address *</Label>
            <Input
              id="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => updateFormData("ownerEmail", e.target.value)}
              placeholder="john.smith@organization.com"
            />
          </div>
          <div>
            <Label htmlFor="ownerPhone">Phone Number</Label>
            <Input
              id="ownerPhone"
              value={formData.ownerPhone}
              onChange={(e) => updateFormData("ownerPhone", e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This person will receive login credentials
            and will be the primary contact for your organization&apos;s
            account. They can add additional administrators later.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-6 w-6 text-white" />
        </div>
        <CardTitle>Choose Your Plan & Coverage</CardTitle>
        <CardDescription>
          Select your billing plan and the countries where you&apos;ll operate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Plan Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Your Plan</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`cursor-pointer border-2 transition-all ${
                  formData.selectedPlan === plan.name
                    ? "border-blue-500 bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 dark:border-green-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => updateFormData("selectedPlan", plan.name)}
              >
                <CardHeader className="text-center pb-2">
                  {plan.recommended && (
                    <Badge className="mx-auto mb-2 bg-blue-600">
                      Recommended
                    </Badge>
                  )}
                  <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                  <div className="text-2xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal">/mo</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Country Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Select Operating Countries
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
            Choose the countries where your organization will provide
            transportation services.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {countries.map((country) => (
              <div
                key={country.code}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.selectedCountries.includes(country.code)
                    ? "border-blue-500 bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 dark:border-green-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => toggleCountry(country.code)}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-sm font-medium">{country.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Source */}
        <div>
          <Label htmlFor="referralSource">How did you hear about us?</Label>
          <Select
            value={formData.referralSource}
            onValueChange={(value) => updateFormData("referralSource", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select referral source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Search</SelectItem>
              <SelectItem value="social">Social Media</SelectItem>
              <SelectItem value="referral">
                Referral from another organization
              </SelectItem>
              <SelectItem value="conference">Conference/Event</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-6 w-6 text-white" />
        </div>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>
          Please review your information and accept our terms to complete
          registration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gradient-to-r dark:from-blue-500 dark:to-purple-600 p-6 rounded-lg space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900">Organization</h4>
            <p className="text-gray-600 dark:text-gray-200">
              {formData.organizationName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-200">
              {formData.slug}.actsOnWheels.com
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900">Primary Contact</h4>
            <p className="text-gray-600 dark:text-gray-200">
              {formData.ownerFirstName} {formData.ownerLastName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-200">
              {formData.ownerEmail}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900">Plan & Coverage</h4>
            <p className="text-gray-600 dark:text-gray-200">
              {plans.find((p) => p.name === formData.selectedPlan)?.displayName}{" "}
              Plan
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-200">
              Operating in:{" "}
              {formData.selectedCountries
                .map((code) => countries.find((c) => c.code === code)?.name)
                .join(", ")}
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) =>
                updateFormData("acceptTerms", checked)
              }
            />
            <Label htmlFor="acceptTerms" className="text-sm">
              I agree to the{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="acceptPrivacy"
              checked={formData.acceptPrivacy}
              onCheckedChange={(checked) =>
                updateFormData("acceptPrivacy", checked)
              }
            />
            <Label htmlFor="acceptPrivacy" className="text-sm">
              I agree to the{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>What happens next?</strong> We&apos;ll review your
            application within 1-2 business days. Once approved, you&apos;ll
            receive login credentials and setup instructions via email.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="size-8 relative">
                <CarBack
                  size={32}
                  patrolDistance={8} // pixels left/right
                  duration={2} // seconds for one full patrol
                  className="absolute top-0 left-0"
                />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight">
                  Acts
                  <span className="text-blue-600">On</span>
                  Wheels
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-100 font-medium tracking-widest uppercase">
                  Church Transportation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {renderStepIndicator()}

        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button onClick={nextStep} className="flex items-center">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center"
            >
              {loading ? "Submitting..." : "Submit Registration"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        <Separator className="mt-6 max-w-2xl mx-auto" />

        <div className="text-sm text-gray-600 dark:text-gray-300 mt-6 text-center">
          Already have an account?{" "}
          <Link
            href="/platform/login"
            className="text-blue-600 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
