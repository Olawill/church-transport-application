import { createTRPCRouter, publicProcedure } from "@/trpc/init";
import { z } from "zod";

import {
  countriesByContinent,
  getCitiesForState,
  getStatesForCountry,
} from "@/lib/countries";

export const placesRouter = createTRPCRouter({
  countries: publicProcedure.query(() => {
    return countriesByContinent;
  }),

  states: publicProcedure
    .input(
      z.object({
        countryCode: z.string(),
      })
    )
    .query(({ input }) => getStatesForCountry(input.countryCode)),

  cities: publicProcedure
    .input(
      z.object({
        countryCode: z.string(),
        stateCode: z.string(),
      })
    )
    .query(({ input }) =>
      getCitiesForState(input.countryCode, input.stateCode)
    ),
});
