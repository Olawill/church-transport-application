import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type CreateAppealType =
  inferRouterOutputs<AppRouter>["appeal"]["getAppealedUser"]["appeals"][number];
