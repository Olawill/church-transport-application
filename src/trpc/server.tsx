/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";
import {
  dehydrate,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  HydrationBoundary,
  QueryKey,
} from "@tanstack/react-query";

// Proper type for that includes both regular and infinite query options
type PrefetchOptions =
  | FetchQueryOptions<unknown, Error, unknown, QueryKey>
  | FetchInfiniteQueryOptions<unknown, Error, unknown, QueryKey, unknown>;

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
