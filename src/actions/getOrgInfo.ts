"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";

export const getOrgInfo = async () => {
  const session = await auth();

  if (!session) {
    return {
      error: "You are not authorized",
    };
  }

  // TODO: Check if user is owner, show all branch

  try {
    const organization = await prisma.systemConfig.findFirst({
      where: { id: "cmg9oivx30000m7n9zd4glcme" },
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

export const setHeadquarter = async (addressId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "You are not authorized",
    };
  }

  // TODO: Check if user is admin or owner
  // Check if address exist
  // Check if address belongs to organization
  // Get the current headquarter, if any and make branch
  // Set address to headquarter
};

// Delete branch
// Only owner
// Check if address exist
// Check if address belongs to organization
// Check if admin for address has more than 1 address linked
// If not change admin role to user
// Then delete address
