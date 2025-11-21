"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CarBack } from "@/components/icons/car";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Building2, HelpCircleIcon, Lock, Mail } from "lucide-react";
import { getSession, signIn } from "next-auth/react";

const PlatformLoginPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const session = await getSession();
      if (
        session?.user &&
        ["PLATFORM_ADMIN", "PLATFORM_USER"].includes(session.user.role)
      ) {
        router.push("/platform/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: "/platform/dashboard",
      });

      if (result?.error) {
        toast.error("Invalid credentials");
      } else if (result?.ok) {
        // Check if user has platform access
        const session = await getSession();
        if (
          session?.user &&
          ["PLATFORM_ADMIN", "PLATFORM_USER"].includes(session.user.role)
        ) {
          router.push("/platform/dashboard");
        } else {
          toast.error("Access denied. Platform access required.");
          await signIn("credentials", { redirect: false }); // Sign out
        }
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-4 border border-purple-600 px-4 py-2 rounded-lg">
            <Link
              href="/help"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-200 italic hover:text-gray-900"
            >
              <HelpCircleIcon className="size-4" />
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-6">
              <div className="relative justify-center flex items-center w-full">
                <CarBack
                  size={48}
                  patrolDistance={8} // pixels left/right
                  duration={2} // seconds for one full patrol
                  // className="absolute -top-2 left-1/2 -translate-x-1/2"
                />
              </div>
              <CardTitle className="text-2xl">
                <div>
                  <div className="font-bold tracking-tight">
                    Acts
                    <span className="text-blue-600">On</span>
                    Wheels
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-100 font-medium tracking-widest uppercase">
                    Church Transportation
                  </div>
                </div>
              </CardTitle>
              <Separator className="my-2" />
              <CardDescription>
                Sign in to the ActsOnWheels platform administration
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Email/Password Login */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="admin@actsOnWheels.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Enter your password"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {/* Platform Access Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Building2 className="size-12 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Platform Access Required</p>
                    <p>
                      This area is restricted to platform administrators and
                      staff. If you&apos;re an organization member, please visit
                      your organization&apos;s specific domain.
                    </p>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="text-center space-y-2">
                <div>
                  <Link
                    href="/platform/forgot-password"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Need an organization account?{" "}
                  <Link
                    href="/register"
                    className="text-blue-600 hover:underline"
                  >
                    Register your organization
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlatformLoginPage;
