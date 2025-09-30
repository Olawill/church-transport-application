import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Verify the address belongs to the user
    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Use a transaction to update default status
    await prisma.$transaction([
      // Remove default from all other addresses
      prisma.address.updateMany({
        where: {
          userId: session.user.id,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set default address error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
