import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type UserType =
  inferRouterOutputs<AppRouter>["users"]["getUsers"][number];
