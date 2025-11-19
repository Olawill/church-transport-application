"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify-icon/react";
import { Eye, EyeClosed, Loader, LogIn, OctagonAlertIcon } from "lucide-react";
import { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

import { CustomFormLabel } from "@/components/custom-form-label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { env } from "@/env/client";
import { QRContent } from "@/features/profile/components/security-tab";
import { useConfirmExtended } from "@/hooks/use-confirm-extended";
import { requestPasswordReset, signIn } from "@/lib/auth-client";
import {
  loginSchema,
  LoginSchema,
  passwordResetSchema,
  PasswordResetValues,
} from "@/schemas/authSchemas";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import z from "zod";

const otpTypeSchema = z.object({
  type: z.enum(["TOTP", "OTP"]),
});

const codeSchema = z.object({
  code: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});

type OTPTypeValues = z.infer<typeof otpTypeSchema>;

type CodeValues = z.infer<typeof codeSchema>;

export const LoginForm = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const router = useRouter();

  const otTypeForm = useForm<OTPTypeValues>({
    resolver: zodResolver(otpTypeSchema),
    defaultValues: { type: "OTP" },
  });

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const passwordReset = searchParams.get("passwordReset");
  const errorParams = searchParams.get("error");

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

  const [EnableTwoFactorDialog, confirmEnableTwoFactor] =
    useConfirmExtended<OTPTypeValues>({
      title: "Enable 2FA",
      message:
        "Do you want to enable Two-Factor Authentication? This adds an extra layer of security to your account. Please select a type, default is OTP.",
      update: true,
      cancelText: "Skip",
      primaryText: "Continue",
      form: otTypeForm,
      renderForm: (form) => (
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <CustomFormLabel title="2FA Type" />
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="TOTP">TOTP</SelectItem>
                  <SelectItem value="OTP">OTP</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ),
    });

  const [QrDialog, confirmQr] = useConfirmExtended<never, { url: string }>({
    title: "Your TOTP QR Code",
    message:
      "Scan this QR code with your authenticator app. Then enter code when you click confirm code.",
    initialValue: { url: "" },
    renderContent: ({ value }) => <QRContent url={value.url} />,
    cancelText: "Close",
    secondaryText: "Confirm Code",
  });

  const [CodeDialog, confirmCode] = useConfirmExtended<CodeValues>({
    title: "Enter verification code",
    message: "We sent a 6-digit code to your email address",
    form: codeForm,
    renderForm: (form) => (
      <FormField
        control={form.control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <CustomFormLabel title="Verification code" />
            <FormControl>
              <InputOTP
                {...field}
                maxLength={6}
                id="otp"
                required
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
            <FormMessage />
          </FormItem>
        )}
      />
    ),
    secondaryText: "Enable 2FA",
  });

  const handleShowQr = async () => {
    const result = await confirmQr();
    if (result.action === "cancel") {
      console.log("Dialog closed");
      return;
    }

    await handleCode();
  };

  const handleCode = async () => {
    const result = await confirmCode();
    if (result.action === "cancel") {
      console.log("Dialog closed");
      return;
    }
  };

  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: async (data) => {
        // Check if this is users first time logging in.
        const firstLogin = data.isFirstTimeLoginIn;

        if (firstLogin) {
          const result = await confirmEnableTwoFactor();

          if (result.action === "confirm") {
            console.log("Enable 2FA"); // TODO: Finish 2FA and also on profiles page (Also, add ability to regenerate backup codes.)
            const formValues = result.formValues;

            if (formValues) {
              if (formValues.type === "TOTP") {
                await handleShowQr();
              } else {
                await handleCode();
              }
            }
          }
        }
        // await queryClient.invalidateQueries(trpc.auth.session.queryOptions());
        toast.success("Logged in successfully");
        router.push(redirectUrl as Route);
      },
      onError: (error) => {
        setError(error.message);
        toast.error("An error occurred during login");
      },
    })
  );

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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

  const handleOAuthSignIn = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    setError(null);
    setLoading(true);

    await signIn.social(
      {
        provider,
        callbackURL: "/",
        // disableRedirect: true,
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
      }
    );
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams);
    params.set("passwordReset", "true");
    router.push(`?${params.toString()}`);
  };

  // const userPassword = form.watch("password");

  return (
    <>
      <EnableTwoFactorDialog />
      <QrDialog />
      <CodeDialog />

      <Card className="w-full max-w-md mx-auto shadow-lg transition-all duration-300">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {passwordReset ? "Reset Your Password" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {passwordReset
              ? "Enter your email to reset your password"
              : "Sign in to access your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 w-full">
          {!passwordReset && (
            <>
              {/* OAuth Sign-in Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={loading || oauthLoading !== null}
                  className="w-full relative h-11 bg-white hover:bg-gray-50"
                >
                  {oauthLoading === "google" ? (
                    <>
                      <Loader className="absolute left-3 size-5 animate-spin" />
                      Connecting to Google
                    </>
                  ) : (
                    <>
                      <FcGoogle className="absolute left-3 size-5" />
                      <span>Continue with Google</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOAuthSignIn("facebook")}
                  disabled={loading || oauthLoading !== null}
                  className="w-full relative h-11 bg-white hover:bg-gray-50"
                >
                  {oauthLoading === "facebook" ? (
                    <>
                      <Loader className="absolute left-3 size-5 animate-spin" />
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
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {!!error && (
            <Alert className="bg-destructive/10 border-none">
              <OctagonAlertIcon className="size-4 !text-destructive" />
              <p className="text-xs break-words !whitespace-normal">{error}</p>
            </Alert>
          )}

          {passwordReset ? (
            <PasswordResetForm setError={setError} />
          ) : (
            // Email/Password Form
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-2"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          disabled={login.isPending}
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
                    <FormItem className="space-y-1">
                      <FormLabel>
                        Password
                        <Button
                          type="button"
                          variant="link"
                          onClick={handleReset}
                          className="ml-auto inline-block text-sm font-light underline-offset-4 hover:text-blue-500 pr-0"
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
                            disabled={login.isPending}
                          />

                          <Button
                            variant="ghost"
                            type="button"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={
                              login.isPending || !form.watch("password")
                            }
                          >
                            {showPassword ? (
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

                <Button
                  type="submit"
                  className="w-full mt-1"
                  disabled={login.isPending}
                >
                  {login.isPending ? (
                    <>
                      <Loader className="size-4" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="size-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-2 text-center">
            <p className="text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                prefetch
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

const PasswordResetForm = ({
  setError,
}: {
  setError: (value: string | null) => void;
}) => {
  const [resettingPassword, setResettingPassword] = useState(false);

  const resetPasswordForm = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: PasswordResetValues) => {
    setError(null);
    setResettingPassword(true);

    const validatedFields = passwordResetSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Invalid email");
      return;
    }

    const { email } = validatedFields.data;

    requestPasswordReset(
      {
        email,
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
      {
        onSuccess: (data) => {
          setResettingPassword(false);
          setError(null);
          console.log(data);
        },
        onError: (ctx) => {
          setResettingPassword(false);
          setError(ctx.error.message);
          console.log(ctx.error.message);
        },
      }
    );
  };

  return (
    <Form {...resetPasswordForm}>
      <form
        onSubmit={resetPasswordForm.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-full min-w-sm mx-auto"
      >
        <FormField
          control={resetPasswordForm.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  disabled={resettingPassword}
                />
              </FormControl>
              <div className="min-h-[1.25rem]">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={resettingPassword}>
          {resettingPassword ? (
            <>
              <Loader className="size-4" />
              Resetting Password...
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              Reset Password
            </>
          )}
        </Button>

        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={resettingPassword}
          asChild
        >
          <Link href="/login">Back to Login</Link>
        </Button>
      </form>
    </Form>
  );
};
