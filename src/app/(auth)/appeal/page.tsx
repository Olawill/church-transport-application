import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingState } from "@/components/screen-states/loading-state";
import { AppealView } from "@/features/appeal/components/users/appeal-view";

export const metadata: Metadata = {
  title: "Appeal",
  description:
    "Appeal account access rejection to gain access your ActsOnWheels account to manage your church transportation needs",
  openGraph: {
    title: "Appeal | ActsOnWheels",
    description: "Access your church transportation account",
  },
};

const AppealPage = () => {
  return (
    <Suspense
      fallback={
        <LoadingState
          title="Loading appeal form"
          description="Please wait while we load the form"
        />
      }
    >
      <AppealView />
    </Suspense>
  );
};

export default AppealPage;
