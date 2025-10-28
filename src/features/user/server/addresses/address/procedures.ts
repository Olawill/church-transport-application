import { z } from "zod";

import { prisma } from "@/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const userAddressRouter = createTRPCRouter({
  updateUserAddress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        street: z.string(),
        city: z.string(),
        province: z.string(),
        postalCode: z.string(),
        country: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, street, city, province, postalCode, country } = input;

      // Validate required fields
      if (!id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "All address fields are required",
        });
      }

      // Verify the address belongs to the user
      const existingAddress = await prisma.address.findFirst({
        where: {
          id,
          userId: ctx.auth.user.id,
          isActive: true,
        },
      });

      if (!existingAddress) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      // Check if user is trying to change the name to one that already exists
      if (name !== existingAddress.name) {
        const duplicateAddress = await prisma.address.findFirst({
          where: {
            userId: ctx.auth.user.id,
            name,
            isActive: true,
            id: { not: id },
          },
        });

        if (duplicateAddress) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You already have an address with this name",
          });
        }
      }

      const updatedAddress = await prisma.address.update({
        where: { id },
        data: {
          name,
          street,
          city,
          province,
          postalCode,
          country: country || "Canada",
        },
      });

      return updatedAddress;
    }),

  deleteUserAddress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Verify the address belongs to the user
      const address = await prisma.address.findFirst({
        where: {
          id,
          userId: ctx.auth.user.id,
          isActive: true,
        },
      });

      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      // Don't allow deleting the default address if it's the only one
      if (address.isDefault) {
        const otherAddresses = await prisma.address.findMany({
          where: {
            userId: ctx.auth.user.id,
            id: { not: id },
            isActive: true,
          },
        });

        if (otherAddresses.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot delete your only address",
          });
        }

        // Set another address as default before deleting
        await prisma.address.update({
          where: { id: otherAddresses[0].id },
          data: { isDefault: true },
        });
      }

      // Soft delete the address
      await prisma.address.update({
        where: { id },
        data: { isActive: false },
      });

      return { success: true };
    }),

  setDefaultAddress: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Verify the address belongs to the user
      const address = await prisma.address.findFirst({
        where: {
          id,
          userId: ctx.auth.user.id,
          isActive: true,
        },
      });

      if (!address) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Address not found",
        });
      }

      // Use a transaction to update default status
      await prisma.$transaction([
        // Remove default from all other addresses
        prisma.address.updateMany({
          where: {
            userId: ctx.auth.user.id,
            isActive: true,
          },
          data: { isDefault: false },
        }),
        // Set this address as default
        prisma.address.update({
          where: { id },
          data: { isDefault: true },
        }),
      ]);

      return { success: true };
    }),
});
