import { cn } from "@/lib/utils";
import { FaSms, FaWhatsappSquare } from "react-icons/fa";
import { MdMarkEmailUnread } from "react-icons/md";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { GetUserProfile } from "@/features/user/types";
import { useConfirm } from "@/hooks/use-confirm";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useForm } from "react-hook-form";
import {
  otpSchema,
  OtpValues,
  whatsAppNotificationSchema,
  WhatsAppNotificationSchema,
} from "@/schemas/authSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomPhoneInput } from "@/components/custom-phone-input";

interface NotificationsTab {
  profile: GetUserProfile | null;
  toggleUserSettings: (
    field: "emailNotifications" | "smsNotifications" | "whatsAppNotifications",
    currentValue: boolean
  ) => Promise<void>;
}

export const NotificationsTab = ({
  profile,
  toggleUserSettings,
}: NotificationsTab) => {
  const codeForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: "",
    },
  });

  const whatsAppForm = useForm<WhatsAppNotificationSchema>({
    resolver: zodResolver(whatsAppNotificationSchema),
    defaultValues: {
      whatsappNumber: "",
    },
  });

  const [EmailVerificationDialog, confirmEmailVerification] = useConfirm({
    title: "Verify your email!",
    message:
      "You need to verify your email before you can enable email notifications. Click the button below to send the Verification email to your email address.",
    primaryText: "Send Email",
  });

  const [PhoneVerificationDialog, confirmPhoneVerification] = useConfirm({
    title: "Verify your phone Number!",
    message:
      "You need to verify your phone number before you can enable sms notifications. Click the button below to send the otp to your phone number.",
    primaryText: "Send OTP",
  });

  const [WhatsAppVerificationDialog, confirmwhatsAppVerification] = useConfirm({
    title: "Verify your whatsApp Number!",
    message:
      "You need to ensure you have a whatsApp number before you can enable whatsApp notifications. Click the button below to send the otp to your whatsApp number.",
    primaryText: "Send OTP",
    update: true,
    form: whatsAppForm,
    renderForm: (form) => {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile &&
              profile.phoneNumber !== null &&
              (() => {
                const phone = profile.phoneNumber;

                return (
                  <div className="flex items-center justify-between space-x-2">
                    <Label>Use Phone Number for whatsApp?</Label>
                    <Switch
                      disabled={!phone}
                      onCheckedChange={(checked) =>
                        form.setValue("whatsappNumber", checked ? phone : "")
                      }
                      // className="disabled:cursor-not-allowed"
                    />
                  </div>
                );
              })()}

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
        </>
      );
    },
  });

  const [CodeDialog, confirmCode] = useConfirm({
    title: "Enter OTP Code",
    message: "Please provide the OTP sent to your number",
    update: true,
    primaryText: "Verify",
    form: codeForm,
    renderForm: (form) => (
      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Verification Code</FormLabel>
            <FormControl>
              <InputOTP
                {...field}
                maxLength={6}
                id="otp"
                containerClassName="gap-4"
              >
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:h-16 *:data-[slot=input-otp-slot]:w-12 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </FormControl>
            <FormDescription>
              Didn&apos;t receive the code?{" "}
              <Button
                type="button"
                variant="link"
                onClick={async () => {
                  console.log("Sent");
                  // await authClient.twoFactor.sendOtp({});
                }}
                className="px-0 cursor-pointer"
              >
                Resend
              </Button>
            </FormDescription>
          </FormItem>
        )}
      />
    ),
  });

  const handleToggleSettings = async (
    settingsType:
      | "emailNotifications"
      | "smsNotifications"
      | "whatsAppNotifications",
    currentValue: boolean
  ) => {
    if (!profile) return;
    if (!settingsType) return;

    if (settingsType === "emailNotifications") {
      const isVerified = profile.emailVerified;
      if (!isVerified) {
        const result = await confirmEmailVerification();

        if (result.action === "cancel") {
          // Do Nothing
          return;
        }

        if (result.action === "confirm") {
          // TODO: Trigger verification email
          console.log("Sending Verification email", currentValue);
          return;
        }
      }
      // toggleUserSettings("emailNotifications", currentValue);
    }

    if (settingsType === "smsNotifications") {
      const isVerified = profile.phoneNumberVerified;
      if (!isVerified) {
        const result = await confirmPhoneVerification();

        if (result.action === "cancel") {
          // Do Nothing
          return;
        }

        if (result.action === "confirm") {
          // TODO: Trigger verification email
          console.log("Sending OTP SMS", currentValue);
          return;
        }
      }
      // toggleUserSettings("smsNotifications", currentValue);
    }

    if (settingsType === "whatsAppNotifications") {
      const isVerified = Boolean(profile.whatsappNumber);
      if (!isVerified) {
        const result = await confirmwhatsAppVerification();

        if (result.action === "cancel") {
          // Do Nothing
          return;
        }

        if (result.action === "confirm") {
          // TODO: Trigger verification email
          console.log("Sending OTP SMS", currentValue);
          return;
        }
      }
      // toggleUserSettings("smsNotifications", currentValue);
    }
  };
  return (
    <>
      <EmailVerificationDialog />
      <PhoneVerificationDialog />
      <WhatsAppVerificationDialog />
      <CodeDialog />

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Notification Form */}
          <div className="space-y-6">
            {/* Email Notification */}
            <div className="flex items-start justify-between">
              <div>
                <Label>
                  <MdMarkEmailUnread />
                  Email Notification
                </Label>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  You need to verify your email to receive email notifications
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  className={cn(profile?.emailNotifications && "bg-green-500")}
                  variant={
                    profile?.emailNotifications ? "secondary" : "default"
                  }
                >
                  {profile?.emailNotifications ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={profile?.emailNotifications}
                  onCheckedChange={async (checked) => {
                    console.log({ checked });
                    // toggleUserSettings("emailNotifications", !checked);
                    await handleToggleSettings("emailNotifications", checked);
                  }}
                  // disabled={!profile?.emailVerified}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* SMS Notification */}
            <div className="flex items-start justify-between">
              <div>
                <Label>
                  <FaSms />
                  SMS Notification
                </Label>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  You need to verify your phone number to receive sms
                  notifications
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  className={cn(profile?.smsNotifications && "bg-green-500")}
                  variant={profile?.smsNotifications ? "secondary" : "default"}
                >
                  {profile?.smsNotifications ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={profile?.smsNotifications}
                  onCheckedChange={(checked) => {
                    toggleUserSettings("smsNotifications", !checked);
                  }}
                  // disabled={!profile?.phoneNumberVerified}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* whatsApp Notification */}
            <div className="flex items-start justify-between">
              <div>
                <Label>
                  <FaWhatsappSquare />
                  whatsApp Notification
                </Label>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  You need whatsApp number to receive whatsApp notifications
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  className={cn(
                    profile?.whatsAppNotifications && "bg-green-500"
                  )}
                  variant={
                    profile?.whatsAppNotifications ? "secondary" : "default"
                  }
                >
                  {profile?.whatsAppNotifications ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  checked={profile?.whatsAppNotifications}
                  onCheckedChange={(checked) => {
                    toggleUserSettings("whatsAppNotifications", !checked);
                  }}
                  // disabled={!profile?.whatsappNumber}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
