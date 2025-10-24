import { createTRPCRouter } from "../init";

import { placesRouter } from "@/features/places/server/procedures";

export const appRouter = createTRPCRouter({
  places: placesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
