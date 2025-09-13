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

    const { name, street, city, province, postalCode, country } =
      await request.json();

    const { id } = await params;
    // Verify the address belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Check if user is trying to change the name to one that already exists
    if (name !== existingAddress.name) {
      const duplicateAddress = await prisma.address.findFirst({
        where: {
          userId: session.user.id,
          name,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateAddress) {
        return NextResponse.json(
          {
            error: "You already have an address with this name",
          },
          { status: 400 }
        );
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

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error("Address update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const DELETE = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = (await params).id;
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

    // Don't allow deleting the default address if it's the only one
    if (address.isDefault) {
      const otherAddresses = await prisma.address.findMany({
        where: {
          userId: session.user.id,
          id: { not: id },
          isActive: true,
        },
      });

      if (otherAddresses.length === 0) {
        return NextResponse.json(
          {
            error: "Cannot delete your only address",
          },
          { status: 400 }
        );
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Address deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
