import { z } from "zod";

import { prisma } from "@/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { geocodeAddress } from "@/lib/geocoding";
import { AnalyticsService } from "@/lib/analytics";

export const userAddressesRouter = createTRPCRouter({
  getUserAddresses: protectedProcedure.query(async ({ ctx }) => {
    const addresses = await prisma.address.findMany({
      where: {
        userId: ctx.auth.user.id,
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return addresses;
  }),

  createUserAddress: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        street: z.string(),
        city: z.string(),
        province: z.string(),
        postalCode: z.string(),
        country: z.string(),
        isProfileCompletion: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        name,
        street,
        city,
        province,
        postalCode,
        country,
        isProfileCompletion,
      } = input;

      // Validate required fields
      if (!name || !street || !city || !province || !postalCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All address fields are required",
        });
      }

      try {
        // Check if user already has an address with this name
        const existingAddress = await prisma.address.findFirst({
          where: {
            userId: ctx.auth.user.id,
            name,
            isActive: true,
          },
        });

        if (existingAddress && name !== "Other") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You already have an address with the title ${name}`,
          });
        }

        // Check if this is the user's first address
        const addressCount = await prisma.address.count({
          where: {
            userId: ctx.auth.user.id,
            isActive: true,
          },
        });

        const isFirstAddress = addressCount === 0;

        // Get coordinate for address
        const coordinates = await geocodeAddress({
          street,
          city,
          province,
          postalCode,
          country,
        });

        if (coordinates == null) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid address information",
          });
        }

        const address = await prisma.address.create({
          data: {
            userId: ctx.auth.user.id,
            name,
            street,
            city,
            province,
            postalCode,
            country: country || "Canada",
            isDefault: isFirstAddress, // First address becomes default
            longitude: coordinates.longitude,
            latitude: coordinates.latitude,
          },
        });

        if (isProfileCompletion) {
          // track oauth completion
          await AnalyticsService.trackOAuthCompletion(
            ctx.auth.user.id,
            ctx.auth.user.provider,
          );

          // track user registration for oauth users, completing their profile
          await AnalyticsService.trackUserRegistration(
            ctx.auth.user.id,
            "oauth",
            ctx.auth.user.provider,
          );
        }

        return address;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Failed to create address:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create address",
        });
      }
    }),
});
