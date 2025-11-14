"use client";

import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { signOut } from "@/lib/auth-client";

export const PendingApprovalView = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRedirect = async () => {
    setLoading(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
          },
          onError: (ctx) => {
            console.error("Sign out error:", ctx.error);
            toast.error("Failed to redirect");
          },
        },
      });
    } catch (error) {
      console.error("Redirect error:", error);
      toast.error("Failed to redirect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Account Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Thank you for completing your profile! Your account is currently
              under review by our administrators.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">What happens next?</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-200 space-y-1 list-disc list-inside">
              <li>An administrator will review your account</li>
              <li>You&apos;ll receive an email once approved</li>
              <li>This typically takes 24-48 hours</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-200">
            If you have any questions, please contact support.
          </p>

          <Button
            onClick={handleRedirect}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2Icon className="size-4 animate-spin" />}
            {loading ? "Redirecting to Login..." : "Back to Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
