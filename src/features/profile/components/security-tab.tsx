import {
  AlertCircleIcon,
  CheckIcon,
  CopyIcon,
  KeyRoundIcon,
  RefreshCcwDotIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
} from "lucide-react";
import { useForm, UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";

import { CustomFormLabel } from "@/components/custom-form-label";
import { GetUserProfile } from "@/features/user/types";
import { SecurityUpdateSchema } from "@/schemas/adminCreateNewUserSchema";
import { actionItems, SecuritySidebar } from "./security-sidebar";
import {
  otpSchema,
  OtpValues,
  twoFactorFirstTimeToggleSchema,
  TwoFactorFirstTimeToggleValues,
  twoFactorToggleSchema,
  TwoFactorToggleValues,
} from "@/schemas/authSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProfileParams } from "../hooks/use-profile-params";
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ImQrcode } from "react-icons/im";
import { useConfirm } from "@/hooks/use-confirm";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";
import { authClient, twoFactor, useSession } from "@/lib/auth-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { OTPChoice } from "@/generated/prisma/enums";
import { toast } from "sonner";
import { APP_NAME } from "@/config/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MdOutlineCameraswitch } from "react-icons/md";

interface SecurityTabProps {
  securityForm: UseFormReturn<SecurityUpdateSchema>;
  profile: GetUserProfile | null;
  handleChangePassword: (values: SecurityUpdateSchema) => void;
  isChangingPassword: boolean;
}

type ChangePasswordProps = Pick<
  SecurityTabProps,
  "securityForm" | "handleChangePassword" | "isChangingPassword"
>;

type SecurityAction = (typeof actionItems)[number]["label"];

const SECURITY_ACTIONS = actionItems.map((item) => item.label);

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
  handleChangePassword,
  isChangingPassword,
}: SecurityTabProps) => {
  const { data: session } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const toggle2FA = useMutation(trpc.profile.toggle2FA.mutationOptions({}));

  const handleVerifyCode = async ({
    email,
    twoFactorMethod,
  }: {
    email?: string;
    twoFactorMethod: OTPChoice;
  }) => {
    const result = await confirmCode();

    if (result.action === "cancel") {
      if (twoFactorMethod === "OTP" && email) {
        // disable 2FA if code verification is cancelled
        await toggle2FA.mutateAsync(
          {
            email,
            value: false,
            twoFactorMethod: null,
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries(
                trpc.userProfile.getUserProfile.queryOptions()
              );
              queryClient.invalidateQueries(trpc.auth.session.queryOptions());
            },
          }
        );
      }
      toast.info("2FA setup was cancelled.");
      return;
    }
    const formValues = result.formValues;
    if (formValues) {
      if (twoFactorMethod === "OTP") {
        const { error } = await twoFactor.verifyOtp({
          code: formValues.code,
          trustDevice: true,
        });
        if (error) {
          toast.error(error.message || "Failed to verify OTP code");
          return;
        }
        queryClient.invalidateQueries(
          trpc.userProfile.getUserProfile.queryOptions()
        );
        queryClient.invalidateQueries(trpc.auth.session.queryOptions());
        codeForm.reset();
        toast.success("Two-Factor Authentication has been enabled.");
      } else {
        const { error } = await twoFactor.verifyTotp({
          code: formValues.code,
          trustDevice: true,
        });
        if (error) {
          toast.error(error.message || "Failed to verify TOTP code");
          return;
        }
        queryClient.invalidateQueries(
          trpc.userProfile.getUserProfile.queryOptions()
        );
        queryClient.invalidateQueries(trpc.auth.session.queryOptions());
        codeForm.reset();
        toast.success("Two-Factor Authentication has been enabled.");
      }
    }
  };

  const handleShowQR = async (method: OTPChoice) => {
    const result = await confirmQR();
    if (result.action === "cancel") {
      return;
    }
    await handleVerifyCode({ twoFactorMethod: method });
  };

  const twoFactorForm = useForm<TwoFactorToggleValues>({
    resolver: zodResolver(twoFactorToggleSchema),
    defaultValues: {
      password: "",
    },
  });

  const twoFactorFirstTimeForm = useForm<TwoFactorFirstTimeToggleValues>({
    resolver: zodResolver(twoFactorFirstTimeToggleSchema),
    defaultValues: {
      password: "",
      type: "TOTP",
    },
  });

  const codeForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: "",
    },
  });

  const [params] = useProfileParams();
  const { securityAction } = params;
  const securityItems: Record<SecurityAction, React.ReactNode> = useMemo(
    () => ({
      "Change Password": (
        <ChangePassword
          securityForm={securityForm}
          handleChangePassword={handleChangePassword}
          isChangingPassword={isChangingPassword}
        />
      ),
      "Generate Backup Codes": <GenerateBackupCodes />,
      "Get TOTP URI": <GetTotpURI />,
      "Switch 2FA Method": <SwitchTwoFactorMethod />,
    }),
    [securityForm, handleChangePassword, isChangingPassword]
  );

  const [totpSetup, setTotpSetup] = useState<{
    totpURI: string;
    backupCodes: string[];
  } | null>(null);

  const [FirstTimeEnableDialog, confirmFirstTimeEnable] =
    useConfirm<TwoFactorFirstTimeToggleValues>({
      title: "Enable 2FA",
      message:
        "Please enter your password to enable Two-Factor Authentication. This adds an extra layer of security to your account.",
      form: twoFactorFirstTimeForm,
      renderForm: (form) => (
        <>
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>2FA Type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select 2FA Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TOTP">TOTP</SelectItem>
                    <SelectItem value="OTP">OTP</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
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
        </>
      ),
      secondaryText: "Enable 2FA",
      update: true,
    });

  const [EnableDialog, confirmEnable] = useConfirm<TwoFactorToggleValues>({
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

  const [DisableDialog, confirmDisable] = useConfirm<TwoFactorToggleValues>({
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

  const [CodeDialog, confirmCode] = useConfirm({
    title: "Enter Verification Code",
    message:
      "You are about to enable Two-Factor authentication. This will make your account more secure",
    update: true,
    primaryText: "Verify Code",
    cancelText: "Skip",
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
            {session?.user.otpChoice === "OTP" && (
              <FormDescription>
                Didn&apos;t receive the code?{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={async () => {
                    await authClient.twoFactor.sendOtp({});
                  }}
                  className="px-0 cursor-pointer"
                >
                  Resend
                </Button>
              </FormDescription>
            )}
          </FormItem>
        )}
      />
    ),
  });

  const [QRDialog, confirmQR, setQRValue] = useConfirm({
    exposeValue: true,
    title: "Setup Authenticator App",
    message: "Scan this QR code with your authenticator app.",
    initialValue: totpSetup,
    renderContent: ({ value }) => {
      if (!value || !value.backupCodes || !value.totpURI) {
        return (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="size-48 bg-muted/40 animated-pulse rounded-lg" />
            <p className="text-sm text-muted-foreground">
              Preparing QR code setup...
            </p>
          </div>
        );
      }

      return <QRBackupCodeContent {...value} />;
    },
    cancelText: "Skip",
    secondaryText: "Proceed",
  });

  const handleTwoFactorType = async (
    type: OTPChoice,
    password: string,
    isFirstTimeEnable: boolean
  ) => {
    if (type === "OTP") {
      await toggle2FA.mutateAsync(
        {
          email: session?.user.email as string,
          twoFactorMethod: "OTP",
          value: true,
        },
        {
          onSuccess: async (data) => {
            await authClient.twoFactor.sendOtp();
            await handleVerifyCode({
              email: data.email,
              twoFactorMethod: data.twoFactorMethod as OTPChoice,
            });
            queryClient.invalidateQueries(
              trpc.userProfile.getUserProfile.queryOptions()
            );
            queryClient.invalidateQueries(trpc.auth.session.queryOptions());
          },
          onError: (error) => {
            toast.error(error.message || "Failed to enable 2FA");
          },
        }
      );
    }

    if (type === "TOTP" && isFirstTimeEnable) {
      const { data, error } = await twoFactor.enable({
        password,
        issuer: APP_NAME,
      });
      if (error) {
        toast.error(error.message || "Failed to generate QR code");
        return;
      }
      setTotpSetup(data);
      setQRValue(data);
      await handleShowQR(type);
      await toggle2FA.mutateAsync({
        email: session?.user.email as string,
        twoFactorMethod: "TOTP",
      });
    } else {
      await handleVerifyCode({
        email: session?.user.email as string,
        twoFactorMethod: "TOTP",
      });
      await toggle2FA.mutateAsync({
        email: session?.user.email as string,
        value: true,
      });
      queryClient.invalidateQueries(
        trpc.userProfile.getUserProfile.queryOptions()
      );
      queryClient.invalidateQueries(trpc.auth.session.queryOptions());
    }
  };

  const handleOpen = async (checked: boolean) => {
    const isFirstTimeEnable = session?.user.otpChoice === null;
    const result =
      checked && isFirstTimeEnable
        ? await confirmFirstTimeEnable()
        : checked && !isFirstTimeEnable
          ? await confirmEnable()
          : await confirmDisable();

    if (result.action === "cancel") return;

    const formValues = result.formValues;

    if (checked && isFirstTimeEnable) {
      const { type, password } = formValues as TwoFactorFirstTimeToggleValues;

      await handleTwoFactorType(type, password, isFirstTimeEnable);
      twoFactorFirstTimeForm.reset();
      return;
    }

    if (checked && !isFirstTimeEnable) {
      const { password } = formValues as TwoFactorToggleValues;

      if (session?.user.otpChoice === "OTP") {
        await handleTwoFactorType("OTP", password, isFirstTimeEnable);
        twoFactorForm.reset();
        return;
      }
      if (session?.user.otpChoice === "TOTP") {
        await handleTwoFactorType("TOTP", password, isFirstTimeEnable);
        twoFactorForm.reset();
        return;
      }
      toast.error("Invalid 2FA method selected.");
      return;
    }

    if (!checked) {
      const { password } = formValues as TwoFactorToggleValues;
      if (!password) {
        toast.error("Please enter your password to disable 2FA.");
        return;
      }
      await toggle2FA.mutateAsync(
        {
          email: session?.user.email as string,
          value: false,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries(
              trpc.userProfile.getUserProfile.queryOptions()
            );
            queryClient.invalidateQueries(trpc.auth.session.queryOptions());
            twoFactorForm.reset();
            toast.success("Two-Factor Authentication has been disabled.");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to disable 2FA");
          },
        }
      );
      return;
    }
  };

  return (
    <>
      {/* Enable 2FA */}
      <EnableDialog />

      {/* Enable 2FA for the First Time*/}
      <FirstTimeEnableDialog />

      {/* Disable 2FA */}
      <DisableDialog />

      {/* Verification Dialog */}
      <CodeDialog />

      {/* QR Dialog */}
      <QRDialog />

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
                checked={profile?.twoFactorEnabled || false}
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
                <Separator className="mt-4" />
                <CardContent className="space-y-4 mt-6">
                  {securityItems[securityAction as SecurityAction] ?? (
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

const GenerateBackupCodes = () => {
  const { data: session } = useSession();

  const backupCodeForm = useForm<TwoFactorToggleValues>({
    resolver: zodResolver(twoFactorToggleSchema),
    defaultValues: {
      password: "",
    },
  });

  const [copied, setCopied] = useState(false);
  const [backupCodeContent, setBackupCodeContent] = useState<string[]>([]);

  const handleCopy = async (val: string) => {
    await navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { EnableDialog, confirmEnable } = useTwoFactorPassword({
    title: "Generate Backup Codes",
    message:
      "Please enter your password to generate backup codes. You can use the backup codes to recover access to your account if you lose access to your authenticator app.",
    secondaryText: "Confirm",
    update: true,
    form: backupCodeForm,
  });

  const [BackupCodeDialog, confirmBackupCode, setBackupCodeValue] = useConfirm({
    exposeValue: true,
    title: "Save Codes",
    message: "Store this somewhere safe.",
    initialValue: { backupCodes: backupCodeContent },
    renderContent: ({ value }) => {
      if (!value) {
        return (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="size-48 bg-muted/40 animated-pulse rounded-lg" />
            <p className="text-sm text-muted-foreground">
              Preparing Backup codes setup...
            </p>
          </div>
        );
      }

      return (
        <>
          <BackupCodeContent {...value} />

          <Button
            onClick={() => handleCopy(value.backupCodes.join("\n"))}
            variant="outline"
            className="flex items-center gap-2 mt-4 w-full"
          >
            {copied ? (
              <>
                <CheckIcon className="size-4" /> Copied!
              </>
            ) : (
              <>
                <CopyIcon className="size-4" /> Copy Backup Codes
              </>
            )}
          </Button>
        </>
      );
    },
    cancelText: "Close",
    secondaryText: "Saved",
  });

  const handleGenerate = async () => {
    if (
      !session ||
      session.user.otpChoice !== "TOTP" ||
      !session.user.twoFactorEnabled
    ) {
      toast.error(
        "You need to enable 2FA with TOTP method to generate backup codes."
      );
      return;
    }
    const result = await confirmEnable();

    if (result.action === "cancel") return;

    const formValues = result.formValues;

    if (formValues) {
      const { password } = formValues;

      const { data, error } = await twoFactor.generateBackupCodes({
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to generate backup codes");
        return;
      }

      backupCodeForm.reset();
      setBackupCodeContent(data.backupCodes);
      setBackupCodeValue({ backupCodes: data.backupCodes });

      const backupResult = await confirmBackupCode();

      if (backupResult.action === "cancel") return;
    }
  };

  return (
    <>
      <BackupCodeDialog />
      <EnableDialog />

      <p className="text-sm text-muted-foreground">
        Backup codes can be used to access your account if you lose access to
        your authenticator app.
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium">Instructions:</p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Generate new backup codes</li>
          <li>Store them in a secure location</li>
          <li>Each code can only be used once</li>
        </ul>
      </div>
      {session?.user.twoFactorEnabled && session.user.otpChoice === "TOTP" ? (
        <Button className="w-full" onClick={handleGenerate}>
          <RefreshCcwDotIcon className="size-4" />
          Generate New Backup Codes
        </Button>
      ) : (
        <Alert className="bg-background">
          <AlertCircleIcon />
          <AlertTitle className="text-xl">Enable 2FA</AlertTitle>
          <AlertDescription>
            You cannot generate backup codes at this time. You need to enable
            Two Factor Authentication to generate backup codes and select TOTP
            as your 2FA method.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

const ChangePassword = ({
  securityForm,
  handleChangePassword,
  isChangingPassword,
}: ChangePasswordProps) => (
  <Form {...securityForm}>
    <form
      className="space-y-4"
      onSubmit={securityForm.handleSubmit(handleChangePassword)}
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
                disabled={isChangingPassword}
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
                disabled={isChangingPassword}
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
                disabled={isChangingPassword}
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
        disabled={!securityForm.formState.isDirty || isChangingPassword}
      >
        <KeyRoundIcon className="size-4" />
        Update Password
      </Button>
    </form>
  </Form>
);

const GetTotpURI = () => {
  const { data: session } = useSession();
  const qRCodeForm = useForm<TwoFactorToggleValues>({
    resolver: zodResolver(twoFactorToggleSchema),
    defaultValues: {
      password: "",
    },
  });

  const [totpURI, setTotpURI] = useState<string | null>(null);

  // Using our extended confirm dialog
  const [QRDialog, confirmQR, setQRValue] = useConfirm({
    exposeValue: true,
    title: "Setup Authenticator App",
    message: "Scan this QR code with your authenticator app.",
    initialValue: totpURI,
    renderContent: ({ value }) => {
      if (!value) {
        return (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="size-48 bg-muted/40 animated-pulse rounded-lg" />
            <p className="text-sm text-muted-foreground">
              Preparing QR code setup...
            </p>
          </div>
        );
      }

      return <QRCodeContent totpURI={value} />;
    },
    cancelText: "Close",
    secondaryText: "Setup Complete",
  });

  const { EnableDialog: PasswordDialog, confirmEnable: confirmPassword } =
    useTwoFactorPassword({
      title: "Generate TOTP URI",
      message:
        "Please enter your password to generate the URI for your authenticator app.",
      secondaryText: "Generate URI",
      update: true,
      form: qRCodeForm,
    });

  const handleShowQR = async () => {
    const result = await confirmQR();
    if (result.action === "cancel") {
      return;
    }
  };

  const handlePasswordSubmit = async () => {
    if (
      !session ||
      session.user.otpChoice !== "TOTP" ||
      !session.user.twoFactorEnabled
    ) {
      toast.error(
        "You need to enable 2FA with TOTP method to setup TOTP for your authenticator app."
      );
      return;
    }

    const result = await confirmPassword();
    if (result.action === "cancel") {
      return;
    }

    const formValues = result.formValues;

    if (formValues) {
      const { password } = formValues;

      const { data, error } = await twoFactor.getTotpUri({
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to generate TOTP URI");
        return;
      }

      // Reset the form after successful submission
      qRCodeForm.reset();
      setTotpURI(data.totpURI);
      setQRValue(data.totpURI);

      await handleShowQR();
    }
  };

  return (
    <>
      <QRDialog />

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
      {session?.user.twoFactorEnabled && session.user.otpChoice === "TOTP" ? (
        <Button
          className="w-full disabled:cursor-not-allowed"
          onClick={handlePasswordSubmit}
        >
          <ImQrcode className="size-4" />
          Get TOTP URI
        </Button>
      ) : (
        <Alert className="bg-background">
          <AlertCircleIcon />
          <AlertTitle className="text-xl">Enable 2FA</AlertTitle>
          <AlertDescription>
            You cannot setup TOTP for your authenticator app at this time. You
            need to enable Two Factor Authentication to setup TOTP and select
            TOTP as your 2FA method.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

const SwitchTwoFactorMethod = () => {
  const { data: session } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const toggle2FA = useMutation(
    trpc.profile.toggle2FA.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `Your Two-Factor Authentication method has been switched to ${data.twoFactorMethod}.`
        );
        queryClient.invalidateQueries(
          trpc.userProfile.getUserProfile.queryOptions()
        );
        queryClient.invalidateQueries(trpc.auth.session.queryOptions());
      },
      onError: (error) => {
        toast.error(error.message || "Failed to switch 2FA method");
      },
    })
  );

  const twoFactorFirstTimeForm = useForm<TwoFactorFirstTimeToggleValues>({
    resolver: zodResolver(twoFactorFirstTimeToggleSchema),
    defaultValues: {
      password: "",
      type: session?.user.otpChoice || "TOTP",
    },
  });

  const handleSubmit = async (values: TwoFactorFirstTimeToggleValues) => {
    const validatedFields = twoFactorFirstTimeToggleSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Invalid form submission.");
      return;
    }

    const { type } = validatedFields.data;

    await toggle2FA.mutateAsync({
      email: session?.user.email as string,
      twoFactorMethod: type,
    });
  };
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Switch your Two-Factor Authentication method.
      </p>

      {session?.user.twoFactorEnabled && session.user.otpChoice === "TOTP" ? (
        <Form {...twoFactorFirstTimeForm}>
          <form
            onSubmit={twoFactorFirstTimeForm.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={twoFactorFirstTimeForm.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>2FA Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select 2FA Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TOTP">TOTP</SelectItem>
                      <SelectItem value="OTP">OTP</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={twoFactorFirstTimeForm.control}
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
            <Button
              type="submit"
              className="w-full disabled:cursor-not-allowed"
            >
              <MdOutlineCameraswitch className="size-4" />
              Switch
            </Button>
          </form>
        </Form>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">Instructions:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>
                Enable Two-Factor Authentication by clicking the switch in the
                card above
              </li>
              <li>
                Confirm your password and select the 2FA method you want only if
                this is your first time enabling 2FA.
              </li>
              <li>Follow the instruction on the 2FA screen.</li>
            </ul>
          </div>
          <Alert className="bg-background">
            <AlertCircleIcon />
            <AlertTitle className="text-xl">Enable 2FA</AlertTitle>
            <AlertDescription>
              You cannot switch your Two-Factor Authentication method at this
              time. You need to enable Two Factor Authentication to switch your
              2FA method.
            </AlertDescription>
          </Alert>
        </>
      )}
    </>
  );
};

export const QRBackupCodeContent = (value: {
  totpURI: string;
  backupCodes: string[];
}) => {
  const { data: session } = useSession();
  return (
    <div className="flex flex-col items-center gap-4">
      <QRCodeContent totpURI={value.totpURI} />
      {session?.user.otpChoice === null && (
        <BackupCodeContent backupCodes={value.backupCodes} />
      )}
    </div>
  );
};

export const QRCodeContent = ({ totpURI }: { totpURI: string }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(totpURI);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const color = theme === "dark" ? "#d04f99" : "#7c699c";

  return (
    <>
      <div className="border p-2 rounded-lg justify-self-center">
        <QRCode
          value={totpURI}
          size={256}
          className="rounded text-red-500"
          title="ActsOnWheels"
          fgColor={color}
          bgColor="transparent"
        />
      </div>

      <Button
        onClick={handleCopy}
        variant="outline"
        className="flex items-center gap-2 mt-4 justify-self-center"
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
    </>
  );
};

export const BackupCodeContent = ({
  backupCodes,
}: {
  backupCodes: string[];
}) => (
  <div>
    <p className="text-sm font-medium mb-2">Backup Codes</p>
    <p className="text-xs text-muted-foreground mb-2">
      Save these codes in a safe place. You can use them to access your account
      if you lose your device.
    </p>

    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
      {backupCodes.map((code, i) => (
        <div key={i} className="bg-muted p-2 rounded text-center">
          {code}
        </div>
      ))}
    </div>
  </div>
);

const useTwoFactorPassword = ({
  title,
  message,
  update,
  secondaryText,
  primaryText,
  form,
}: {
  title: string;
  message: string;
  secondaryText?: string;
  primaryText?: string;
  update?: boolean;
  form?: UseFormReturn<TwoFactorToggleValues>;
}) => {
  const twoFactorForm = useForm<TwoFactorToggleValues>({
    resolver: zodResolver(twoFactorToggleSchema),
    defaultValues: {
      password: "",
    },
  });

  const [EnableDialog, confirmEnable] = useConfirm<TwoFactorToggleValues>({
    title,
    message,
    form: form ?? twoFactorForm,
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
    secondaryText,
    primaryText,
    update,
  });

  return { EnableDialog, confirmEnable };
};
// function confirmBackupCode() {
//   throw new Error("Function not implemented.");
// }
