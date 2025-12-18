"use client";

import { MailIcon, MessageSquareIcon, ShieldIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { signOut, twoFactor, useSession } from "@/lib/auth-client";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { useForm } from "react-hook-form";
import { otpSchema, OtpValues } from "@/schemas/authSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Route } from "next";
import { OTP } from "@/config/constants";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  type: "email" | "phone" | "whatsapp";
}

const TIME_REMAINING = OTP.PERIOD * 60;

export const OTPInputView = ({ type }: OTPInputProps) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const twoFactorMethod = searchParams.get("method");
  const firstLogin = searchParams.get("firstLogin");
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [isPending, startTransition] = useTransition();

  const [timeLeft, setTimeLeft] = useState(TIME_REMAINING); // 5 minutes
  const [attempts, setAttempts] = useState(0);

  const codeForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: "",
    },
  });

  const toggle2FA = useMutation(trpc.profile.toggle2FA.mutationOptions({}));
  const deleteTwoFactorToken = useMutation(
    trpc.auth.deleteTwoFactorToken.mutationOptions({})
  );

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const verifyCode = async (code: string) => {
    if (attempts >= OTP.ALLOWED_ATTEMPTS) {
      toast.error("Too many failed attempts. Please request a new code.");
      return;
    }

    startTransition(async () => {
      const isValidMethod =
        twoFactorMethod && ["TOTP", "OTP"].includes(twoFactorMethod);

      if (!isValidMethod) {
        toast.error("Unknown Two-Factor Authentication Method");
        return;
      }

      const { error } = await (twoFactorMethod === "TOTP"
        ? twoFactor.verifyTotp({ code, trustDevice: true })
        : twoFactor.verifyOtp({ code, trustDevice: true }));

      startTransition(() => {
        // Handle error and attempts
        if (error) {
          setAttempts((prev) => {
            const next = prev + 1;
            if (next >= OTP.ALLOWED_ATTEMPTS) {
              toast.error(
                "Maximum attempts reached. Please request a new code."
              );
            }
            return next;
          });

          toast.error(
            error.message || "Verification failed. Please try again."
          );
          return;
        }

        // ✅ Delete the pending token after successful verification
        if (session?.user?.id) {
          deleteTwoFactorToken.mutate({
            userId: session.user.id,
          });
        }

        // Handle success case
        toast.success("Two-Factor Authentication successful. Redirecting...");
        queryClient.invalidateQueries(trpc.auth.session.queryOptions());
        router.push(redirectTo as Route);
      });
    });
  };

  const handleSubmit = async (values: OtpValues) => {
    const validated = otpSchema.safeParse(values);

    if (!validated.success) {
      toast.error(
        z.treeifyError(validated.error).errors.join(", ") ||
          "Error validating your code"
      );
      return;
    }

    const { code } = validated.data;

    await verifyCode(code);
  };

  const handleResend = async () => {
    const { data, error } = await twoFactor.sendOtp({});
    if (data) {
      toast.success("OTP Code has been sent to you");
      setTimeLeft(TIME_REMAINING);
      setAttempts(0);
    }

    if (error) {
      toast.error(error.message || "Error sending OTP");
    }
    // if (onResendOTP) {
    //   onResendOTP();
    //   setTimeLeft(TIME_REMAINING);
    //   setAttempts(0);
    //   setOtp(["", "", "", "", "", ""]);
    //   inputRefs.current[0]?.focus();
    // }
  };

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        },
      },
    });
  };

  const handleSkip = async () => {
    // Helper: show a redirecting toast and push the route
    const showRedirectToast = (message: string) => {
      return toast.promise<{ message: string }>(
        () =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve({ message });
              router.push(redirectTo as Route);
            }, 2000)
          ),
        {
          loading: "Redirecting...",
          success: ({ message }) => `${message} Redirecting to ${redirectTo}`,
          error: "Error redirecting",
        }
      );
    };

    // -------- FIRST LOGIN LOGIC --------
    if (firstLogin) {
      switch (twoFactorMethod) {
        case "OTP": {
          // Disable OTP-based 2FA manually
          await toggle2FA.mutateAsync(
            {
              email: session?.user.email as string,
              value: false,
              twoFactorMethod: null,
            },
            {
              onSuccess: () => {
                // ✅ Delete pending token
                if (session?.user?.id) {
                  deleteTwoFactorToken.mutate({
                    userId: session.user.id,
                  });
                }

                queryClient.invalidateQueries(trpc.auth.session.queryOptions());

                showRedirectToast(
                  "Two-Factor Authentication will be disabled, you can re-enable it in your profile."
                );
              },
            }
          );

          return;
        }

        case "TOTP": {
          // ✅ Delete pending token for TOTP too
          if (session?.user?.id) {
            deleteTwoFactorToken.mutate({
              userId: session.user.id,
            });
          }

          // TOTP disabling is automatic
          showRedirectToast(
            "Two-Factor Authentication will be disabled, you can re-enable it in your profile."
          );

          return;
        }

        default: {
          toast.info("Unknown Two-Factor Authentication method");
          return;
        }
      }
    }

    // -------- NOT FIRST LOGIN: FORCE SIGN OUT --------
    toast.promise(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({
              message: "You need to verify your account to login.",
            });
            handleSignOut();
          }, 2000)
        ),
      {
        loading: "Signing out...",
        success: () =>
          `Two-Factor Authentication is required to sign in. Redirecting to "/login"`,
        error: "Error signing out",
      }
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-center">
          <ShieldIcon className="size-5 mr-2" />
          Verify Your{" "}
          {type === "email"
            ? "Email"
            : type === "phone"
              ? "Phone Number"
              : "whatsApp Number"}
        </CardTitle>
        <CardDescription className="text-center">
          {twoFactorMethod === "TOTP" ? (
            "Please enter the code from your Authenticator."
          ) : (
            <>
              We&apos;ve sent a 6-digit verification code to{" "}
              <span className="font-medium">
                {type === "email"
                  ? "Email"
                  : type === "phone"
                    ? "Phone Number"
                    : "whatsApp Number"}
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Form {...codeForm}>
          <form onSubmit={codeForm.handleSubmit(handleSubmit)}>
            <FormField
              control={codeForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="justify-center">
                    Verification Code
                  </FormLabel>
                  <FormControl>
                    <InputOTP
                      {...field}
                      maxLength={6}
                      id="otp"
                      autoFocus
                      containerClassName="gap-4"
                      disabled={
                        isPending ||
                        (twoFactorMethod === "OTP" && timeLeft === 0)
                      }
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
                </FormItem>
              )}
            />

            {/* TODO: Add Skip button to cancel 2FA */}
            <div className="flex w-full items-center justify-between mt-4">
              {firstLogin && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isPending}
                >
                  Skip
                </Button>
              )}

              <Button
                type="submit"
                className={cn(!firstLogin && "w-full")}
                disabled={
                  isPending ||
                  (twoFactorMethod === "OTP" && timeLeft === 0) ||
                  !codeForm.formState.isDirty
                }
              >
                Verify
              </Button>
            </div>
          </form>
        </Form>

        <div className="text-center space-y-3">
          {/* <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="size-4 mr-1" />
            Time remaining: {formatTime(timeLeft)}
          </div> */}

          {attempts > 0 && (
            <Alert>
              <AlertDescription>
                {attempts >= 3
                  ? "Maximum attempts reached. Please request a new code."
                  : `${3 - attempts} attempts remaining`}
              </AlertDescription>
            </Alert>
          )}

          {twoFactorMethod !== "TOTP" && (
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={timeLeft > 0 || isPending}
              className="w-full"
            >
              {type === "email" ? (
                <MailIcon className="size-4" />
              ) : (
                <MessageSquareIcon className="size-4" />
              )}
              {timeLeft > 0
                ? `Resend in ${formatTime(timeLeft)}`
                : `Resend Code via ${type === "email" ? "Email" : "SMS"}`}
            </Button>
          )}
        </div>

        {twoFactorMethod !== "TOTP" && (
          <Alert>
            <ShieldIcon className="size-4" />
            <AlertDescription>
              For security purposes, this code will expire in{" "}
              {formatTime(timeLeft)}. If you didn&apos;t receive the code, check
              your spam folder or try resending.
            </AlertDescription>
          </Alert>
        )}

        {twoFactorMethod === "TOTP" && !firstLogin && (
          <div className="text-center text-xs">
            Lost access to your Authenticator? Use your backup code{" "}
            <Button
              type="button"
              variant="link"
              disabled={isPending || !firstLogin}
              onClick={async () =>
                router.push(
                  `/two-factor/verify-backup-code?redirect=${encodeURIComponent(redirectTo)}`
                )
              }
              className="px-0 cursor-pointer text-xs"
            >
              Use Backup Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const BackupCodeView = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const codeForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: "",
    },
  });

  const handleVerifyBackupCode = async (values: OtpValues) => {
    startTransition(async () => {
      const validated = otpSchema.safeParse(values);

      if (!validated.success) {
        toast.error("Invalid Backup Code. Please enter a new code.");
        return;
      }

      const { data, error } = await twoFactor.verifyBackupCode({
        code: validated.data.code,
        disableSession: false,
        trustDevice: true,
      });

      startTransition(() => {
        if (error) {
          toast.error(error.message || "Failed to verify with your code");
          return;
        }

        if (data) {
          toast.success("Account verified successfully");
          router.push(redirectTo as Route);
        }
      });
    });
  };

  return (
    <Card className="w-full max-sm:min-w-sm min-md:min-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-center">
          <ShieldIcon className="size-5 mr-2" />
          Verify Your Account
        </CardTitle>
        <CardDescription className="text-center">
          Please enter a backup code in the input below. Once used, it will be
          removed from the database and can&apos;t be used again
        </CardDescription>
      </CardHeader>

      <Form {...codeForm}>
        <form onSubmit={codeForm.handleSubmit(handleVerifyBackupCode)}>
          <CardContent className="space-y-4 w-full">
            <FormField
              control={codeForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="justify-center text-md">
                    Backup Code
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      {...field}
                      disabled={isPending}
                      className="w-full"
                      placeholder="Enter Code here..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          {/* TODO: Add Skip button to cancel 2FA */}
          <CardFooter className="mt-4 flex w-full items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`)
              }
              disabled={isPending}
            >
              Back to Login
            </Button>

            <Button type="submit" disabled={isPending}>
              Verify
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
