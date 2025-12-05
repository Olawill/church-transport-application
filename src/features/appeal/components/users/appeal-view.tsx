"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  SendIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { CustomFormLabel } from "@/components/custom-form-label";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import { userAppealSchema, UserAppealValues } from "@/schemas/authSchemas";

export const AppealView = () => {
  const searchParams = useSearchParams();
  const appealToken = searchParams.get("appeal_token");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const form = useForm<UserAppealValues>({
    resolver: zodResolver(userAppealSchema),
    defaultValues: {
      reason: "",
      additionalInfo: "",
    },
  });

  // Decode the appeal token to get user email
  useState(() => {
    if (appealToken) {
      try {
        // Decode the base64 token
        const decoded = atob(appealToken);
        const data = JSON.parse(decoded);
        setUserEmail(data.email);
      } catch {
        setErrorMessage("Invalid appeal link. Please contact support.");
        setStatus("error");
      }
    } else {
      setErrorMessage(
        "No appeal token found. Please use the link from your email."
      );
      setStatus("error");
    }
  });

  const handleSubmit = async (values: UserAppealValues) => {
    const validated = userAppealSchema.safeParse(values);

    if (!validated.success) {
      setErrorMessage("Please provide a reason for your appeal.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      // Call your API to submit the appeal
      const response = await fetch("/api/appeals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appealToken,
          ...validated.data,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit appeal");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to submit appeal. Please try again."
      );
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-secondary/90 rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2Icon className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-4">
            Appeal Submitted Successfully
          </h1>
          <p className="text-center mb-6">
            Thank you for submitting your appeal. Our team will review your case
            and get back to you within 2-3 business days at{" "}
            <span className="font-semibold">{userEmail}</span>.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Reference ID:</strong> {appealToken?.slice(0, 12)}...
            </p>
            <p className="text-sm text-blue-700 mt-2">
              Please save this reference ID for your records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="rounded-2xl shadow-lg max-w-2xl w-full">
      <CardHeader className="mb-8">
        <CardTitle className="text-3xl font-bold mb-2">
          Appeal Your Registration Decision
        </CardTitle>
        <CardDescription>
          We&apos;re sorry your registration was not approved. If you believe
          this decision was made in error, please provide additional information
          below.
        </CardDescription>
        {userEmail && (
          <CardDescription className="text-sm mt-2">
            Appeal for: <span className="font-semibold">{userEmail}</span>
          </CardDescription>
        )}
      </CardHeader>

      {status === "error" && errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 mx-4 flex items-start gap-3">
          <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{errorMessage}</p>
        </div>
      )}

      <CardContent>
        {status !== "error" || (status === "error" && appealToken) ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <CustomFormLabel
                      title="Reason for Appeal"
                      className="text-gray-700"
                    />
                    <FormControl>
                      <Textarea
                        {...field}
                        id="reason"
                        rows={4}
                        className="resize-none shadow-none placeholder:text-primary"
                        placeholder="Please explain why you believe your registration should be reconsidered..."
                        disabled={status === "loading"}
                      />
                    </FormControl>
                    <FormDescription className="text-primary text-xs">
                      Be specific about why you think the rejection was
                      incorrect.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        id="additionalInfo"
                        rows={8}
                        className="resize-none shadow-none placeholder:text-primary"
                        placeholder="Provide any additional context, documents, or information that supports your appeal..."
                        disabled={status === "loading"}
                      />
                    </FormControl>
                    <FormDescription className="text-primary text-xs">
                      Include any relevant details that might help us review
                      your case.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Please note:</strong> Appeals are typically reviewed
                  within 2-3 business days. You will receive an email
                  notification once a decision has been made.
                </p>
              </div>

              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2Icon className="size-5 animate-spin" />
                    Submitting Appeal...
                  </>
                ) : (
                  <>
                    <SendIcon className="size-5" />
                    Submit Appeal
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-primary">
                By submitting this appeal, you confirm that the information
                provided is accurate and complete.
              </p>
            </form>
          </Form>
        ) : (
          <div className="text-center py-8 w-full">
            <p className="mb-4">
              Please contact support for assistance with your appeal.
            </p>
            <a
              href="mailto:support@actsonwheel.com"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              support@actsonwheel.com
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
