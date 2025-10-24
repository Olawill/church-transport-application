import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";

import {
  countriesByContinent,
  getCitiesForState,
  getStatesForCountry,
} from "@/lib/countries";

export const placesRouter = createTRPCRouter({
  countries: baseProcedure.query(() => {
    return countriesByContinent;
  }),

  states: baseProcedure
    .input(
      z.object({
        countryCode: z.string(),
      })
    )
    .query(({ input }) => getStatesForCountry(input.countryCode)),

  cities: baseProcedure
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
