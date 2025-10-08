"use server";

import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma";
import { ChurchBranchContactInfoUpdateSchema } from "@/types/adminCreateNewUserSchema";

// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";

export const getOrgInfo = async (orgId?: string) => {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.OWNER)
  ) {
    return {
      error: "You are not authorized",
    };
  }

  // TODO: Remove this line and make orgId required
  const organizationId = orgId ? orgId : "cmggw9zpx0000it8ref73euxu";

  // TODO: Check if user is owner, show all branch
  // TODO: Check if user is admin, show only branch attached to admin

  try {
    const organization = await prisma.systemConfig.findFirst({
      where: { id: organizationId },
      include: {
        systemBranchInfos: true,
      },
    });

    if (!organization) {
      return {
        error: "Organization not found",
        organization: null,
      };
    }

    return { success: true, organization };
  } catch (error) {
    console.error("Server error:", error);
    // Return error for failed authentication
    return { error: "Server error", organization: null };
  }
};

export const setHeadquarter = async (addressId: string, orgId?: string) => {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.OWNER)
  ) {
    return {
      error: "You are not authorized",
    };
  }

  // TODO: Remove this line and make orgId required
  const organizationId = orgId ? orgId : "cmggw9zpx0000it8ref73euxu";

  // TODO: Check if user is admin or owner
  if (session.user.role === UserRole.ADMIN) {
    console.log("You are an admin");
  }
  if (session.user.role === UserRole.OWNER) {
    console.log("You are an owner");
  }
  try {
    // Check if address exist
    const existingBranch = await prisma.systemBranchInfo.findUnique({
      where: { id: addressId },
    });

    if (!existingBranch) {
      return {
        error: "Branch not found",
      };
    }
    // Check if address belongs to organization
    if (existingBranch.systemConfigId !== organizationId) {
      return {
        success: false,
        error: "Branch does not belong to this organization.",
      };
    }

    // Get the current headquarter, if any and make branch
    await prisma.systemBranchInfo.updateMany({
      where: {
        systemConfigId: organizationId,
        branchCategory: "HEADQUARTER",
      },
      data: {
        branchCategory: "BRANCH",
      },
    });
    // Set address to headquarter
    const updatedBranchInfo = await prisma.systemBranchInfo.update({
      where: { id: addressId },
      data: {
        branchCategory: "HEADQUARTER",
      },
    });

    return {
      success: true,
      updatedBranchInfo,
    };
  } catch (error) {
    console.error("Error setting headquarters: ", error);
    return {
      success: false,
      error: "Failed to set headquarters",
    };
  }
};

export const addBranch = async (
  values: ChurchBranchContactInfoUpdateSchema,
  orgId?: string
) => {
  const session = await auth();

  // TODO: Check authentication and if user is admin or owner
  if (
    !session ||
    (session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.OWNER)
  ) {
    return {
      error: "You are not authorized",
    };
  }
  // TODO: Remove this line and make orgId required
  const organizationId = orgId ? orgId : "cmggw9zpx0000it8ref73euxu";
  // TODO: Check if address belongs to organization
  try {
    // Check if organization existing
    const organization = await prisma.systemConfig.findFirst({
      where: { id: organizationId },
    });

    if (!organization) {
      return {
        error: "Organization not found",
      };
    }
    // Create the branch
    const newBranch = await prisma.systemBranchInfo.create({
      data: {
        systemConfigId: organizationId,
        ...values,
      },
    });

    return {
      success: true,
      newBranch,
    };
  } catch (error) {
    console.error("Error adding branch: ", error);
    return {
      success: false,
      error: "Failed to add branch",
    };
  }
};

export const updateBranch = async (
  addressId: string,
  values: ChurchBranchContactInfoUpdateSchema,
  orgId?: string
) => {
  const session = await auth();

  // TODO: Check if user is admin or owner
  if (
    !session ||
    (session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.OWNER)
  ) {
    return {
      error: "You are not authorized to perform this task",
    };
  }

  // TODO: Remove this line and make orgId required
  const organizationId = orgId ? orgId : "cmggw9zpx0000it8ref73euxu";

  try {
    // Check if address exist
    const existingBranch = await prisma.systemBranchInfo.findUnique({
      where: { id: addressId },
    });

    if (!existingBranch) {
      return {
        error: "Branch not found",
      };
    }

    // Check if address belongs to organization
    if (existingBranch.systemConfigId !== organizationId) {
      return {
        success: false,
        error: "Branch does not belong to this organization.",
      };
    }

    // Update
    const updatedBranchInfo = await prisma.systemBranchInfo.update({
      where: { id: addressId },
      data: {
        ...values,
      },
    });

    return {
      success: true,
      updatedBranchInfo,
    };
  } catch (error) {
    console.error("Error updating branch: ", error);
    return { success: false, error: "Failed to update branch" };
  }
};

// Delete branch
export const deleteBranch = async (addressId: string, orgId?: string) => {
  const session = await auth();

  if (
    !session ||
    (session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.OWNER)
  ) {
    return {
      error: "You are not authorized",
    };
  }

  // TODO: Remove this line and make orgId required
  const organizationId = orgId ? orgId : "cmggw9zpx0000it8ref73euxu";

  // TODO: Only owner
  try {
    // Check if address exist
    const existingBranch = await prisma.systemBranchInfo.findUnique({
      where: { id: addressId },
    });

    if (!existingBranch) {
      return {
        error: "Branch not found",
      };
    }

    // Check if address belongs to organization
    if (existingBranch.systemConfigId !== organizationId) {
      return {
        success: false,
        error: "Branch does not belong to this organization.",
      };
    }
    // TODO: Check if admin for address has more than 1 address linked
    // TODO: If not change admin role to user

    // Then delete address
    await prisma.systemBranchInfo.delete({
      where: {
        id: addressId,
        systemConfigId: organizationId,
      },
    });

    return {
      success: true,
      message: "Branch deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting branch: ", error);
    return { success: false, error: "Failed to delete branch" };
  }
};
