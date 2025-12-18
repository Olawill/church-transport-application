import { requireNoAuth } from "@/lib/session/server-session";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { HydrateClient, prefetch, trpc } from "@/trpc/server";

import { ErrorState } from "@/components/screen-states/error-state";
import {
  SignupForm,
  SignupFormSkeleton,
} from "@/features/auth/components/signup-form";

const SignupPage = async () => {
  await requireNoAuth();

  prefetch(trpc.places.countries.queryOptions());

  return (
    <HydrateClient>
      <ErrorBoundary
        fallback={
          <ErrorState
            title="Registration Form Failed to Load"
            description="An error occurred while loading the sign-up form. Please try again or contact support if the issue continues."
          />
        }
      >
        <Suspense fallback={<SignupFormSkeleton />}>
          <SignupForm />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
};

export default SignupPage;
