"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify-icon/react";
import {
  EyeIcon,
  EyeClosedIcon,
  Loader2Icon,
  LogInIcon,
  OctagonAlertIcon,
} from "lucide-react";
import { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { requestPasswordReset, signIn, twoFactor } from "@/lib/auth-client";
import {
  loginSchema,
  LoginSchema,
  passwordResetSchema,
  PasswordResetValues,
  twoFactorTypeSchema,
  TwoFactorTypeValues,
} from "@/schemas/authSchemas";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "@/hooks/use-confirm";
import { CustomFormLabel } from "@/components/custom-form-label";
import { env } from "@/env/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_NAME } from "@/config/constants";
import { OTPChoice } from "@/generated/prisma/enums";
import { QRBackupCodeContent } from "@/features/profile/components/security-tab";

type ErrorParams = "account_status" | "pending_approval";

const isErrorParam = (value: string | null): value is ErrorParams => {
  return value === "account_status" || value === "pending_approval";
};

export const LoginForm = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const urlError = searchParams.get("error");
  const errorParams: ErrorParams | null = isErrorParam(urlError)
    ? urlError
    : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (errorParams) {
      const message =
        errorParams === "account_status"
          ? "Please check your account status"
          : errorParams.split("_").join(" ");

      setError(message);
    }
  }, [errorParams]);

  const [totpSetup, setTotpSetup] = useState<{
    totpURI: string;
    backupCodes: string[];
  } | null>(null);

  // Login Form
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Two-Factor Type Form
  const twoFactorTypeForm = useForm<TwoFactorTypeValues>({
    resolver: zodResolver(twoFactorTypeSchema),
    defaultValues: {
      type: "TOTP",
    },
  });

  // Forgot Password Form
  const forgotPasswordForm = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  /**
   * Dialogs for confirmation
   * - TwoFactorDialog: for selecting Two Factor Method
   * - QRDialog: for displaying the TOTP OR Code
   * - ForgotPasswordDialog - for requesting password reset
   */
  const [TwoFactorDialog, confirmTwoFactor] = useConfirm<TwoFactorTypeValues>({
    title: "Enable 2FA",
    message:
      "You are about to enable Two-Factor Authentication. This will make your account more secure.",
    form: twoFactorTypeForm,
    renderForm: (form) => (
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
    ),
    secondaryText: "Continue",
    cancelText: "Skip",
    update: true,
  });

  const [QRDialog, confirmQR, setQRValue] = useConfirm({
    exposeValue: true,
    title: "Setup Authenticator App",
    message: "Scan this QR code with your authenticator app.",
    initialValue: totpSetup,
    renderContent: ({ value }) => {
      if (!value || !value.backupCodes || !value.totpURI) {
        return (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="bg-muted/40 size-48 animate-pulse rounded-lg" />
            <p className="text-muted-foreground text-sm">
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

  const [ForgotPasswordDialog, confirmForgotPassword] =
    useConfirm<PasswordResetValues>({
      title: "Forgot Password",
      message:
        "Please enter your email and we’ll send you a password reset link.",
      form: forgotPasswordForm,
      renderForm: (form) => (
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <CustomFormLabel title="Email" />
              <FormControl>
                <Input
                  type="email"
                  {...field}
                  placeholder="Enter your email address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
      secondaryText: "Send",
      update: true,
    });

  /**
   * Mutations
   */
  const updateFirstTimeLogin = useMutation(
    trpc.auth.updateFirstLogin.mutationOptions({}),
  );

  const toggle2FA = useMutation(trpc.profile.toggle2FA.mutationOptions({}));
  const createTwoFactorToken = useMutation(
    trpc.auth.createTwoFactorToken.mutationOptions(),
  );

  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: async (data) => {
        const { isFirstLogin } = data;
        await queryClient.invalidateQueries(trpc.auth.session.queryOptions());

        // ✅ Handle first-time login 2FA setup
        if (isFirstLogin && data.twoFactorMethod === null) {
          const result = await confirmTwoFactor();

          if (result.action === "confirm") {
            const formValues = result.formValues;

            if (formValues) {
              await handleTwoFactorType(
                formValues.type,
                currentPassword,
                isFirstLogin,
              );
            }
          } else {
            // User clicked "Skip" on first login
            // Still redirect to dashboard even if they skip 2FA setup
            // toast.success("Logged in successfully");
            startTransition(() => {
              router.push(redirectUrl as Route);
            });
          }
          // Update first time login at
          await updateFirstTimeLogin.mutateAsync({
            email: data.user.email ?? currentEmail,
          });

          return;
        }

        // ✅ Handle 2FA redirect for existing users
        if ("twoFactorRedirect" in data && data.twoFactorRedirect) {
          if (data.twoFactorMethod === "OTP") {
            // Send OTP
            await twoFactor.sendOtp();
            toast.success("OTP Code has been sent to you");
          }

          startTransition(() => {
            router.push(
              `/two-factor?method=${data.twoFactorMethod}&redirect=${encodeURIComponent(redirectUrl)}&twoFactorRedirect=${data.twoFactorRedirect}&type=email`,
            );
          });
        } else {
          // ✅ No 2FA required - direct login
          toast.success("Logged in successfully");

          startTransition(() => {
            router.push(redirectUrl as Route);
          });
        }
      },
      onError: (error) => {
        setError(error.message);
        toast.error("An error occurred during login");
      },
    }),
  );

  /**
   * Handle First time Two-factor Setup
   * Only show QR Code for TOTP method
   */
  const handleShowQR = async (method: OTPChoice, isFirstLogin: boolean) => {
    if (!currentEmail) {
      toast.error("Email is required");
      return;
    }

    const result = await confirmQR();

    if (result.action === "cancel") {
      toast.warning("Two-Factor Authentication cancelled");
      throw new Error("2FA setup cancelled");
    }

    // Set two factor method in database
    const updatedUser = await toggle2FA.mutateAsync({
      email: currentEmail,
      twoFactorMethod: method,
    });

    // ✅ Create pending token for first-time TOTP setup
    await createTwoFactorToken.mutateAsync({
      userId: updatedUser.id,
    });

    // redirect to verify page with method "TOTP"
    startTransition(() => {
      router.push(
        isFirstLogin
          ? `/two-factor?method=${method}&redirect=${encodeURIComponent(redirectUrl)}&firstLogin=${true}&type=email`
          : `/two-factor?method=${method}&redirect=${encodeURIComponent(redirectUrl)}&type=email`,
      );
    });
  };

  const handleTwoFactorType = async (
    type: OTPChoice,
    password: string,
    isFirstLogin: boolean,
  ) => {
    if (type === "OTP") {
      // Enable two factor manually
      await toggle2FA.mutateAsync(
        {
          email: currentEmail,
          twoFactorMethod: "OTP",
          value: true,
        },
        {
          onSuccess: async (data) => {
            // ✅ Create pending token for first-time OTP setup
            await createTwoFactorToken.mutateAsync({
              userId: data.id,
            });

            await twoFactor.sendOtp();

            // Route to verify-two-factor page
            startTransition(() => {
              router.push(
                isFirstLogin
                  ? `/two-factor?method=${data.twoFactorMethod}&redirect=${encodeURIComponent(redirectUrl)}&firstLogin=${true}&type=email`
                  : `/two-factor?method=${data.twoFactorMethod}&redirect=${encodeURIComponent(redirectUrl)}&type=email`,
              );
            });
          },
          onError: (error) => {
            toast.error(error.message || "Failed to enable 2FA");
          },
        },
      );
    }

    if (type === "TOTP") {
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
      await handleShowQR(type, isFirstLogin);
    }
  };

  // Handle Password Reset request
  const handleForgotPassword = async () => {
    const result = await confirmForgotPassword();

    if (result.action === "cancel") return;

    const formValues = result.formValues;

    if (formValues) {
      const { email } = formValues;

      try {
        await requestPasswordReset({
          email,
          redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
        });

        toast.success("Password reset link sent to your email");
      } catch {
        toast.error("Failed to send password reset link");
      }
    }
  };

  // Handle Email/Password signing in
  const onSubmit = async (values: LoginSchema) => {
    setError(null);

    const validatedFields = loginSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Invalid email/password");
      return;
    }

    const { email, password } = validatedFields.data;

    login.mutate({ email, password });
  };

  // Handle OAuth Sign in/Sign up
  const handleOAuthSignIn = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    setError(null);
    setLoading(true);

    await signIn.social(
      {
        provider,
        callbackURL: "/dashboard",
        newUserCallbackURL: "/complete-profile",
      },
      {
        onSuccess: () => {
          setLoading(false);
          setOauthLoading(null);
        },
        onError: ({ error }) => {
          toast.error(`${provider} sign-in failed`);
          setError(error.message);
          setLoading(false);
        },
      },
    );
  };

  // Current values for email and password
  const currentEmail = form.watch("email");
  const currentPassword = form.watch("password");

  const isLoading = login.isPending || isPending;

  return (
    <>
      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog />

      {/* Two-Factor Type Dialog */}
      <TwoFactorDialog />

      {/* TOTP QR Code Dialog */}
      <QRDialog />

      <Card className="mx-auto w-full max-w-md shadow-lg transition-all duration-300">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent className="w-full space-y-6">
          {/* OAuth Sign-in Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading || loading || oauthLoading !== null}
              className="relative h-11 w-full min-w-sm bg-white hover:bg-gray-50"
            >
              {oauthLoading === "google" ? (
                <>
                  <Loader2Icon className="absolute left-3 size-5 animate-spin" />
                  Connecting to Google
                </>
              ) : (
                <>
                  <FcGoogle className="absolute left-3 size-5" />
                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            {/* <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("facebook")}
              disabled={isLoading || loading || oauthLoading !== null}
              className="relative h-11 w-full bg-white hover:bg-gray-50"
            >
              {oauthLoading === "facebook" ? (
                <>
                  <Loader2Icon className="absolute left-3 size-5 animate-spin" />
                  Connecting to Facebook
                </>
              ) : (
                <>
                  <Icon
                    icon="logos:facebook"
                    className="absolute left-3 size-5"
                    width={20}
                    height={20}
                  />

                  <span>Continue with Facebook</span>
                </>
              )}
            </Button> */}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">
                Or continue with email
              </span>
            </div>
          </div>

          {!!error && (
            <Alert className="bg-destructive/10 border-none">
              <OctagonAlertIcon className="!text-destructive size-4" />
              <p className="text-xs break-words !whitespace-normal">{error}</p>
            </Alert>
          )}

          {/* Email/Password Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        disabled={isLoading}
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleForgotPassword}
                        className="ml-auto inline-block pr-0 text-sm font-light underline-offset-4 hover:text-blue-500 hover:underline"
                      >
                        Forgot your password?
                      </Button>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          disabled={isLoading}
                        />

                        <Button
                          variant="ghost"
                          type="button"
                          size="sm"
                          className="absolute top-0 right-0 h-full px-3 py-2 text-gray-600 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading || !form.watch("password")}
                        >
                          {showPassword ? (
                            <EyeIcon className="size-4" />
                          ) : (
                            <EyeClosedIcon className="size-4" />
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

              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogInIcon className="size-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
