import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { churchBranchContactInfoUpdateSchema } from "@/schemas/adminCreateNewUserSchema";
import { createTRPCRouter, protectedRoleProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const testId = "cmggw9zpx0000it8ref73euxu";

export const organizationRouter = createTRPCRouter({
  getOrganizationData: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        organizationId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { organizationId } = input;

      // TODO: Check if user is owner, show all branch
      // TODO: Check if user is admin, show only branch attached to admin
      const organization = await prisma.organization.findUniqueOrThrow({
        where: { id: organizationId ?? testId },
        include: {
          organizationBranches: true,
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      return organization;
    }),

  setHeadquarter: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        organizationId: z.string().optional(),
        addressId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { organizationId, addressId } = input;

      const result = await prisma.$transaction(async (tx) => {
        // Check if the branch exists
        const existingBranch = await tx.organizationBranch.findUnique({
          where: { id: addressId },
        });

        if (!existingBranch) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Branch not found",
          });
        }

        // Verify ownership
        if (existingBranch.organizationId !== (organizationId ?? testId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Branch does not belong to this organization.",
          });
        }

        // If it’s already the headquarter, skip unnecessary updates
        if (existingBranch.branchCategory === "HEADQUARTER") {
          return existingBranch; // nothing to change
        }

        // Otherwise, demote current headquarter (if any)
        await tx.organizationBranch.update({
          where: {
            id: existingBranch.id,
            organizationId: organizationId ?? testId,
            branchCategory: "HEADQUARTER",
          },
          data: {
            branchCategory: "BRANCH",
          },
        });

        // Promote the selected branch to headquarter
        const updatedBranch = await tx.organizationBranch.update({
          where: { id: addressId },
          data: {
            branchCategory: "HEADQUARTER",
          },
        });

        return updatedBranch;
      });

      return result;
    }),

  addBranch: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        organizationId: z.string().optional(),
        branchName: z.string().nullish(),
        branchCategory: z.enum(["HEADQUARTER", "BRANCH"]),
        street: z.string(),
        city: z.string(),
        province: z.string(),
        postalCode: z.string(),
        country: z.string(),
        churchPhone: z.string(),
        requestCutOffInHrs: z.string(),
        defaultMaxDistance: z.enum(["10", "20", "30", "50"]),
      })
    )
    .mutation(async ({ input }) => {
      const { organizationId, ...values } = input;

      const result = await prisma.$transaction(async (tx) => {
        // Check that the organization exists
        const organization = await tx.organization.findUnique({
          where: { id: organizationId ?? testId },
        });

        if (!organization) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found",
          });
        }

        // Create the branch in the same transaction
        const newBranch = await tx.organizationBranch.create({
          data: {
            organizationId: organizationId ?? testId,
            ...values,
          },
        });

        return newBranch;
      });

      return result;
    }),

  updateBranch: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(
      z.object({
        addressId: z.string(),
        organizationId: z.string(),
        values: churchBranchContactInfoUpdateSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { addressId, organizationId, values } = input;

      const updatedBranch = await prisma.$transaction(async (tx) => {
        // Check existence & ownership atomically
        const existingBranch = await tx.organizationBranch.findUnique({
          where: { id: addressId },
        });

        if (!existingBranch) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Branch not found",
          });
        }

        if (existingBranch.organizationId !== (organizationId ?? testId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Branch does not belong to this organization.",
          });
        }

        // Update branch
        const updated = await tx.organizationBranch.update({
          where: { id: addressId },
          data: { ...values },
        });

        return updated;
      });

      return updatedBranch;
    }),

  deleteBranch: protectedRoleProcedure([UserRole.OWNER])
    .input(
      z.object({
        addressId: z.string(),
        organizationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { addressId, organizationId } = input;
      const userRole = ctx.auth.user.role;

      // Optional: only allow OWNER to delete
      if (userRole !== UserRole.OWNER) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can delete branches.",
        });
      }

      const deletedBranch = await prisma.$transaction(async (tx) => {
        // Validate branch existence & ownership
        const existingBranch = await tx.organizationBranch.findUnique({
          where: { id: addressId },
        });

        if (!existingBranch) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Branch not found",
          });
        }

        if (existingBranch.organizationId !== (organizationId ?? testId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Branch does not belong to this organization.",
          });
        }

        // (Optional) Check if admin has other branches
        // TODO: add logic here if needed before deletion

        // Delete branch
        await tx.organizationBranch.delete({
          where: { id: addressId },
        });

        return existingBranch;
      });

      return deletedBranch;
    }),
});
