import { z } from "zod";

import { prisma } from "@/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, street, city, province, postalCode, country } = input;

      // Validate required fields
      if (!name || !street || !city || !province || !postalCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All address fields are required",
        });
      }

      // Check if user already has an address with this name
      const existingAddress = await prisma.address.findFirst({
        where: {
          userId: ctx.auth.user.id,
          name,
          isActive: true,
        },
      });

      if (existingAddress) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have an address with this name",
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
        },
      });

      return address;
    }),
});
