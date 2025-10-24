import { requireNoAuth } from "@/lib/session/server-session";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { getQueryClient, trpc } from "@/trpc/server";

import { ErrorState } from "@/components/screen-states/error-state";
import {
  SignupForm,
  SignupFormSkeleton,
} from "@/features/auth/components/signup-form";

const SignupPage = async () => {
  await requireNoAuth();

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.places.countries.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<ErrorState title="" description="" />}>
        <Suspense fallback={<SignupFormSkeleton />}>
          <SignupForm />
        </Suspense>
      </ErrorBoundary>
    </HydrationBoundary>
  );
};

export default SignupPage;
