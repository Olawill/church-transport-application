import { LoadingState } from "@/components/screen-states/loading-state";
import { AppealView } from "@/features/appeal/components/users/appeal-view";
import { Suspense } from "react";

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
