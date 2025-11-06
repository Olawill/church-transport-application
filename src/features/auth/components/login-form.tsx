"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify-icon/react";
import { Eye, EyeClosed, Loader, LogIn, OctagonAlertIcon } from "lucide-react";
import { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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

import { signIn } from "@/lib/auth-client";
import { loginSchema, LoginSchema } from "@/schemas/authSchemas";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const LoginForm = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const router = useRouter();

  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: async () => {
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
        callbackURL: "/dashboard",
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

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>Sign in to access your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {!!error && (
          <Alert className="bg-destructive/10 border-none">
            <OctagonAlertIcon className="size-4 !text-destructive" />
            <p className="text-xs break-words !whitespace-normal">{error}</p>
          </Alert>
        )}

        {/* Email/Password Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
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
                <FormItem className="space-y-2">
                  <FormLabel>
                    Password
                    <Link
                      href="/"
                      className="ml-auto inline-block text-sm font-light underline-offset-4 hover:underline hover:text-blue-500"
                    >
                      Forgot your password?
                    </Link>
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
                        disabled={login.isPending || !form.watch("password")}
                      >
                        {showPassword ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeClosed className="h-4 w-4" />
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
              className="w-full mt-6"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <>
                  <Loader className="h-4 w-4" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
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
  );
};
