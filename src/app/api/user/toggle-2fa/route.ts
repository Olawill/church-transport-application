import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const PUT = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: enabled },
      select: { twoFactorEnabled: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Toggle 2FA error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
