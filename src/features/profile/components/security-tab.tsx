import {
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  RefreshCcwDotIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
} from "lucide-react";
import { useForm, UseFormReturn } from "react-hook-form";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ItemSeparator } from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";

import { CustomFormLabel } from "@/components/custom-form-label";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { GetUserProfile } from "@/features/user/types";
import { useConfirmExtended } from "@/hooks/use-confirm-extended";
import { cn } from "@/lib/utils";
import { SecurityUpdateSchema } from "@/schemas/adminCreateNewUserSchema";
import {
  twoFactorToggleSchema,
  TwoFactorToggleValues,
} from "@/schemas/authSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";
import { ImQrcode } from "react-icons/im";
import { useProfileParams } from "../hooks/use-profile-params";
import { SecuritySidebar } from "./security-sidebar";

interface SecurityTabProps {
  securityForm: UseFormReturn<SecurityUpdateSchema>;
  profile: GetUserProfile | null;
  toggleUserSettings: (
    field:
      | "twoFactorEnabled"
      | "emailNotifications"
      | "smsNotifications"
      | "whatsAppNotifications",
    currentValue: boolean
  ) => Promise<void>;
  handleSecuritySubmit: (values: SecurityUpdateSchema) => Promise<void>;
}

type ChangePasswordProps = Pick<
  SecurityTabProps,
  "securityForm" | "handleSecuritySubmit"
>;

type SecurityAction =
  | "Change Password"
  | "Generate Backup Codes"
  | "Get TOTP URI";

const SECURITY_ACTIONS = [
  "Change Password",
  "Generate Backup Codes",
  "Get TOTP URI",
] as const satisfies readonly SecurityAction[];

export const getSecurityActionOrDefault = (
  value: string,
  fallback: string
): SecurityAction | string => {
  return SECURITY_ACTIONS.includes(value as SecurityAction)
    ? (value as SecurityAction)
    : fallback;
};

export const SecurityTab = ({
  securityForm,
  profile,
  toggleUserSettings,
  handleSecuritySubmit,
}: SecurityTabProps) => {
  const twoFactorForm = useForm<TwoFactorToggleValues>({
    resolver: zodResolver(twoFactorToggleSchema),
    defaultValues: { password: "" },
  });

  const [params] = useProfileParams();
  const { securityAction } = params;

  const actionItems: Record<SecurityAction, React.ReactNode> = useMemo(
    () => ({
      "Change Password": (
        <ChangePassword
          securityForm={securityForm}
          handleSecuritySubmit={handleSecuritySubmit}
        />
      ),
      "Generate Backup Codes": <GenerateBackupCodes />,
      "Get TOTP URI": <GetTotpURI />,
    }),
    [securityForm, handleSecuritySubmit]
  );

  const [fat, setFat] = useState(false);
  const [EnableDialog, confirmEnable] =
    useConfirmExtended<TwoFactorToggleValues>({
      title: "Enable 2FA",
      message:
        "Please enter your password to enable Two-Factor Authentication. This adds an extra layer of security to your account.",
      form: twoFactorForm,
      renderForm: (form) => (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <CustomFormLabel title="Password" />
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  placeholder="Enter your password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      secondaryText: "Enable 2FA",
      update: true,
    });

  const [DisableDialog, confirmDisable] =
    useConfirmExtended<TwoFactorToggleValues>({
      title: "Disable 2FA",
      message:
        "You are about to disable Two-Factor Authentication. To proceed, enter your account password?",
      form: twoFactorForm,
      renderForm: (form) => (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <CustomFormLabel title="Password" />
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  placeholder="Enter your password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      secondaryText: "Disable 2FA",
    });

  const handleOpen = async (checked: boolean) => {
    const result = checked ? await confirmEnable() : await confirmDisable();
    // TODO: Use authClient.twoFactor.enable({issuer, password}) or authClient.twoFactor.disable({password})
    setFat(checked);
    // if (result.)
    // toggleUserSettings("twoFactorEnabled", !checked);
  };

  return (
    <>
      {/* Enable 2FA */}
      <EnableDialog />

      {/* Disable 2FA */}
      <DisableDialog />

      <div className="space-y-6">
        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {profile?.twoFactorEnabled ? (
                <ShieldCheckIcon className="size-5 mr-2" />
              ) : (
                <ShieldIcon className="size-5 mr-2" />
              )}
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {profile?.twoFactorEnabled ? "Enabled" : "Disabled"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                // checked={profile?.twoFactorEnabled || false}
                checked={fat}
                onCheckedChange={handleOpen}
                className="cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="overflow-hidden">
          <SidebarProvider
            defaultOpen={true}
            useRelativePositioning={true}
            className="relative"
          >
            <SecuritySidebar />

            <SidebarInset className={cn("flex-1 bg-card")}>
              <div className="flex-1 flex flex-col">
                <CardHeader className="flex items-center">
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                  <CardTitle>
                    {getSecurityActionOrDefault(
                      securityAction,
                      "Security Center"
                    )}
                  </CardTitle>
                </CardHeader>
                <ItemSeparator className="mt-4" />
                <CardContent className="space-y-4 mt-6">
                  {actionItems[securityAction as SecurityAction] ?? (
                    <Empty className="border border-dashed">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <SettingsIcon className="size-10 text-muted-foreground" />
                        </EmptyMedia>

                        <EmptyTitle>No Security Action Selected</EmptyTitle>

                        <EmptyDescription>
                          Choose one of the options from the menu to continue.
                        </EmptyDescription>
                      </EmptyHeader>

                      <EmptyContent className="text-center text-sm text-muted-foreground">
                        Select an item from the list on the left.
                      </EmptyContent>
                    </Empty>
                  )}
                </CardContent>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </Card>
      </div>
    </>
  );
};

const GenerateBackupCodes = () => (
  <>
    <p className="text-sm text-muted-foreground">
      Backup codes can be used to access your account if you lose access to your
      authenticator app.
    </p>
    <div className="space-y-2">
      <p className="text-sm font-medium">Instructions:</p>
      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
        <li>Generate new backup codes</li>
        <li>Store them in a secure location</li>
        <li>Each code can only be used once</li>
      </ul>
    </div>
    <Button className="w-full">
      <RefreshCcwDotIcon className="size-4" />
      Generate New Backup Codes
    </Button>
  </>
);

const ChangePassword = ({
  securityForm,
  handleSecuritySubmit,
}: ChangePasswordProps) => (
  <Form {...securityForm}>
    <form
      className="space-y-4"
      onSubmit={securityForm.handleSubmit(handleSecuritySubmit)}
    >
      {/* Current Password */}
      <FormField
        control={securityForm.control}
        name="currentPassword"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <CustomFormLabel title="Current Password" />
            <FormControl>
              <Input
                {...field}
                type="password"
                name="currentPassword"
                onChange={(e) => field.onChange(e)}
                placeholder="Enter Current Password"
              />
            </FormControl>
            <div className="min-h-[1.25rem]">
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      {/* New Password */}
      <FormField
        control={securityForm.control}
        name="newPassword"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <CustomFormLabel title="New Password" />
            <FormControl>
              <Input
                {...field}
                type="password"
                name="newPassword"
                onChange={(e) => field.onChange(e)}
                placeholder="Enter New Password"
              />
            </FormControl>
            <div className="min-h-[1.25rem]">
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      {/* Confirm New Password */}
      <FormField
        control={securityForm.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <CustomFormLabel title="Confirm New Password" />
            <FormControl>
              <Input
                {...field}
                type="password"
                name="confirmPassword"
                onChange={(e) => field.onChange(e)}
                placeholder="Confirm New password"
              />
            </FormControl>
            <div className="min-h-[1.25rem]">
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      {/* Update Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={!securityForm.formState.isDirty}
      >
        <KeyRoundIcon className="size-4" />
        Update Password
      </Button>
    </form>
  </Form>
);

const GetTotpURI = () => {
  const qRCodeForm = useForm<TwoFactorToggleValues>({
    resolver: zodResolver(twoFactorToggleSchema),
    defaultValues: { password: "" },
  });

  // Using our extended confirm dialog
  const [QrDialog, confirmQr] = useConfirmExtended<never, { url: string }>({
    title: "Your TOTP QR Code",
    message: "Scan this QR code with your authenticator app.",
    initialValue: { url: "" },
    renderContent: ({ value }) => <QRContent url={value.url} />,
    cancelText: "Close",
    secondaryText: "Scanned",
  });

  const [PasswordDialog, confirmPassword] =
    useConfirmExtended<TwoFactorToggleValues>({
      title: "Generate TOTP URI",
      message:
        "Please enter your password to generate the URI for your authenticator app",
      form: qRCodeForm,
      renderForm: (form) => (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <CustomFormLabel title="Password" />
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  placeholder="Enter your password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      secondaryText: "Confirm",
    });

  const handleShowQr = async () => {
    const result = await confirmQr();
    if (result.action === "cancel") {
      console.log("Dialog closed");
      return;
    }
  };

  const handlePasswordSubmit = async () => {
    const result = await confirmPassword();
    if (result.action === "cancel") {
      console.log("Dialog closed");
      return;
    }

    const formValues = result.formValues;
    console.log(formValues);

    // Reset the form after successful submission
    qRCodeForm.reset();

    await handleShowQr();
  };

  return (
    <>
      <QrDialog />

      <PasswordDialog />

      <p className="text-sm text-muted-foreground">
        Scan a TOTP QR code with your authenticator app.
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium">Instructions:</p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Click below to generate your TOTP QR code.</li>
          <li>
            Scan it with your authenticator app (e.g., Google Authenticator).
          </li>
          <li>Each code is linked to your account securely.</li>
        </ul>
      </div>
      <Button className="w-full" onClick={handlePasswordSubmit}>
        <ImQrcode className="size-4" />
        Get TOTP URI
      </Button>
    </>
  );
};

const QRContent = ({ url }: { url: string }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const color = theme === "dark" ? "#d04f99" : "#7c699c";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="border p-2 rounded-lg">
        <QRCode
          value={url}
          size={256}
          className="rounded text-red-500"
          title="ActsOnWheels"
          fgColor={color}
          bgColor="transparent"
        />
      </div>
      <p className="text-sm text-muted-foreground break-all text-center">
        {url}
      </p>
      <Button
        onClick={handleCopy}
        variant="outline"
        className="flex items-center gap-2"
      >
        {copied ? (
          <>
            <CheckIcon className="size-4" /> Copied!
          </>
        ) : (
          <>
            <CopyIcon className="size-4" /> Copy URI
          </>
        )}
      </Button>
    </div>
  );
};
