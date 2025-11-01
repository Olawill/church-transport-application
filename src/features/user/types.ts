import type { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type GetUserProfile =
  inferRouterOutputs<AppRouter>["userProfile"]["getUserProfile"];

export type GetUserAddress =
  inferRouterOutputs<AppRouter>["userAddresses"]["getUserAddresses"][number];
