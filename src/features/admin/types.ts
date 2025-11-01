import type { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

export type adminGetUsers =
  inferRouterOutputs<AppRouter>["adminUsers"]["getUsers"][number];

export type GetServiceType =
  inferRouterOutputs<AppRouter>["services"]["getServices"][number];

export type GetPaginatedServiceType =
  inferRouterOutputs<AppRouter>["services"]["getPaginatedServices"];
