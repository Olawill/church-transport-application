/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

export const getQueryClient = cache(makeQueryClient);
// const caller = createCallerFactory(appRouter)(createTRPCContext);
export const caller = appRouter.createCaller(createTRPCContext);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export const HydrateClient = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
};

export const prefetch = <T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T
) => {
  const queryClient = getQueryClient();

  const isInfiniteQuery = queryOptions.queryKey[1]?.type === "infinite";

  if (isInfiniteQuery) {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
};
