"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  EyeIcon,
  EyeClosedIcon,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "use-debounce";
import { z } from "zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  FormMessage,
} from "@/components/ui/form";

import { passwordStrength } from "@/features/auth/lib/utils";
import { requestPasswordReset, resetPassword } from "@/lib/auth-client";
import {
  passwordResetSchema,
  PasswordResetValues,
  resetPasswordSchema,
  ResetPasswordValues,
} from "@/schemas/authSchemas";
import { env } from "@/env/client";

import { useConfirm } from "@/hooks/use-confirm";
import { CustomFormLabel } from "@/components/custom-form-label";
import { PasswordStrength } from "./password-strength";
import { PasswordScore } from "./signup-form";

export const ResetPasswordView = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const error = searchParams.get("error");
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [strength, setStrength] = useState<PasswordScore>({
    score: 0,
    strength: "weak",
    errors: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const forgotPasswordForm = useForm<PasswordResetValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
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

  const handleForgotPassword = async () => {
    const result = await confirmForgotPassword();

    if (result.action === "cancel") return;

    const formValues = result.formValues;

    if (formValues) {
      const { email } = formValues;

      await requestPasswordReset({
        email,
        redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });
    }
  };

  const [currentPassword] = useDebounce(form.watch("password"), 300);
  const currentConfirmPassword = form.watch("confirmPassword");

  useEffect(() => {
    const { strength, errors } = passwordStrength(currentPassword);

    if (strength === "weak") {
      setStrength({ score: 50, strength, errors });
    }

    if (strength === "good") {
      setStrength({ score: 75, strength, errors });
    }

    if (strength === "strong") {
      setStrength({ score: 100, strength, errors });
    }
  }, [currentPassword]);

  // Error state - invalid or expired token
  if (error) {
    return (
      <>
        <ForgotPasswordDialog />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Reset Link Invalid</CardTitle>
              <CardDescription>
                {error === "expired"
                  ? "This password reset link has expired."
                  : "This password reset link is invalid or has already been used."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please request a new password reset link to continue.
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={handleForgotPassword}>
                Request New Link
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // No token - shouldn't happen in normal flow
  if (!token) {
    return (
      <>
        <ForgotPasswordDialog />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Missing Reset Token</CardTitle>
              <CardDescription>
                No password reset token was provided. Please use the link from
                your email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleForgotPassword}>
                Request Password Reset
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              Password Reset Successfully
            </CardTitle>
            <CardDescription>
              Your password has been updated. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (values: ResetPasswordValues) => {
    const validatedFields = resetPasswordSchema.safeParse(values);

    if (!validatedFields.success) {
      const errors = z.treeifyError(validatedFields.error).errors;
      setFormError(`Password must :\n ${errors.join("\n")}`);
      return;
    }

    const { password, confirmPassword } = validatedFields.data;

    if (password !== confirmPassword) {
      setFormError("Your passwords do not match.");
      return;
    }

    setIsLoading(true);

    await resetPassword(
      {
        newPassword: password,
        token,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setIsLoading(false);

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        },
        onError: ({ error }) => {
          setFormError(error.message || "Failed to reset password");
          setIsLoading(false);
        },
      }
    );
  };

  // Main reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="size-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it&apos;s strong and
            secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <CustomFormLabel title="New Password" />
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="**************"
                            disabled={false}
                          />
                          <Button
                            variant="ghost"
                            type="button"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={false || !form.watch("password")}
                          >
                            {showPassword ? (
                              <EyeIcon className="size-4" />
                            ) : (
                              <EyeClosedIcon className="size-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>

                      <FormDescription>
                        Must be at least 8 characters with uppercase, lowercase,
                        and numbers
                      </FormDescription>

                      {/* Password strength (mobile only) */}
                      {currentPassword && (
                        <div className="block md:hidden mt-2">
                          <PasswordStrength strength={strength} />
                        </div>
                      )}

                      <div className="min-h-[1.25rem]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <CustomFormLabel title="Confirm Password" />
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="**************"
                            disabled={false}
                          />

                          <Button
                            variant="ghost"
                            type="button"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-600"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            disabled={false || !currentConfirmPassword}
                          >
                            {showConfirmPassword ? (
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

                {/* Password strength under both fields on large screens */}
                {currentPassword && (
                  <div className="hidden md:block col-span-2">
                    <PasswordStrength strength={strength} />
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push("/login")}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
