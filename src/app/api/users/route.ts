import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const where: Record<string, string> = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        addresses: {
          where: { isDefault: true },
        },
        _count: {
          select: {
            pickupRequests: true,
            acceptedRequests: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        addresses: {
          where: { isDefault: true },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
