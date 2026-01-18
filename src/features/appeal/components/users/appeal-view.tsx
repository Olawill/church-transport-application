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
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

export const AppealView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const searchParams = useSearchParams();
  const appealToken = searchParams.get("appeal_token");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<UserAppealValues>({
    resolver: zodResolver(userAppealSchema),
    defaultValues: {
      reason: "",
      additionalInfo: "",
    },
  });

  // email function
  const sendEmail = useMutation(
    trpc.emails.sendMail.mutationOptions({
      onSuccess: () => {
        toast.success("Email sent successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send email");
      },
    }),
  );

  // Decode the appeal token to get user email
  const {
    data: decoded,
    error: decodeError,
    isLoading: isDecoding,
  } = useQuery(
    trpc.appeal.decodeAppealToken.queryOptions(
      appealToken ? { token: appealToken } : skipToken,
    ),
  );

  // Determine overall status and error message
  const hasTokenError = !appealToken || Boolean(decodeError);
  const tokenErrorMessage = !appealToken
    ? "No appeal token found. Please use the link from your email."
    : decodeError
      ? "Invalid appeal link. Please contact support."
      : "";

  // create appeal mutatation
  const createAppeal = useMutation(
    trpc.appeal.createAppeal.mutationOptions({
      onSuccess: async () => {
        toast.success(
          "Your appeal has been submitted to the admin. Decision on appeal takes about 2-3 business days.",
        );
        form.reset();
        queryClient.invalidateQueries(
          trpc.appeal.getAppealedUser.queryOptions({}),
        );
        setStatus("success");
        setErrorMessage("");
        // TODO: Send appeal request mail to organization/branch admin
        // await sendEmail.mutateAsync({
        //   to: "",
        //   type: "appeal_request",
        //   name: "",
        //   status: "approved",
        //   username: decoded?.userName,
        // });
      },
      onError: (error) => {
        toast.error(error.message || "Error submitting your appeal");
        setStatus("error");
        setErrorMessage(error.message || "Error submitting your appeal");
      },
    }),
  );

  const handleSubmit = async (values: UserAppealValues) => {
    const validated = userAppealSchema.safeParse(values);

    if (!validated.success) {
      setStatus("error");
      setErrorMessage("Please provide a reason for your appeal.");
      return;
    }

    setStatus("loading");
    await createAppeal.mutateAsync({
      reason: validated.data.reason,
      additionalInfo: validated.data.additionalInfo || "",
      appealToken: appealToken || "",
    });
  };

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-secondary/90 w-full max-w-md rounded-2xl p-8 shadow-xl">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2Icon className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h1 className="mb-4 text-center text-2xl font-bold">
            Appeal Submitted Successfully
          </h1>
          <p className="mb-6 text-center">
            Thank you for submitting your appeal. Our team will review your case
            and get back to you within 2-3 business days at{" "}
            <span className="font-semibold">{decoded?.email}</span>.
          </p>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Reference ID:</strong> {appealToken?.slice(0, 12)}
            </p>
            <p className="mt-2 text-sm text-blue-700">
              Please save this reference ID for your records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while decoding token
  if (isDecoding) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2Icon className="size-10 animate-spin text-blue-600" />
          <p className="text-2xl">Verifying appeal token...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl rounded-2xl shadow-lg">
      <CardHeader className="mb-8">
        <CardTitle className="mb-2 text-3xl font-bold">
          Appeal Your Registration Decision
        </CardTitle>
        <CardDescription>
          We&apos;re sorry your registration was not approved. If you believe
          this decision was made in error, please provide additional information
          below.
        </CardDescription>
        {decoded && decoded.email && (
          <CardDescription className="mt-2 text-sm">
            Appeal for: <span className="font-semibold">{decoded.email}</span>
          </CardDescription>
        )}
      </CardHeader>

      {/* Show token validation errors */}
      {hasTokenError && (
        <div className="mx-4 mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{tokenErrorMessage}</p>
        </div>
      )}

      {/* Show submit errors */}
      {status === "error" && errorMessage && (
        <div className="mx-4 mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <CardContent>
        {!hasTokenError ? (
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
                    <CustomFormLabel title="Reason for Appeal" />
                    <FormControl>
                      <Textarea
                        {...field}
                        id="reason"
                        rows={4}
                        className="placeholder:text-primary border-secondary resize-none shadow-none"
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
                        className="placeholder:text-primary border-secondary resize-none shadow-none"
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

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  <strong>Please note:</strong> Appeals are typically reviewed
                  within 2-3 business days. You will receive an email
                  notification once a decision has been made.
                </p>
              </div>

              <Button
                type="submit"
                disabled={
                  status === "loading" ||
                  !form.formState.isDirty ||
                  createAppeal.isPending
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {status === "loading" ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Submitting Appeal...
                  </>
                ) : (
                  <>
                    <SendIcon className="size-5" />
                    Submit Appeal
                  </>
                )}
              </Button>

              <p className="text-primary text-center text-xs">
                By submitting this appeal, you confirm that the information
                provided is accurate and complete.
              </p>
            </form>
          </Form>
        ) : (
          <div className="w-full py-8 text-center">
            <p className="mb-4">
              Please contact support for assistance with your appeal.
            </p>
            <a
              href="mailto:support@actsonwheel.com"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              support@actsonwheel.com
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
