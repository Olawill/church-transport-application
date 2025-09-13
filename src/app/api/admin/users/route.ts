import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";

export const GET = async () => {
  try {
    const session = await auth();

    if (!session?.user?.role || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        bannedAt: true,
        banReason: true,
        isActive: true,
      },
      orderBy: [
        { status: "asc" }, // Pending first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
