import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const PUT = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const { field, value } = await request.json();

    // Valid boolean fields on User
    const userFields = [
      "twoFactorEnabled",
      "emailNotifications",
      "smsNotifications",
      "whatsAppNotifications",
    ];

    let result;
    if (userFields.includes(field)) {
      result = await prisma.user.update({
        where: { id: userId },
        data: { [field]: value },
        select: { [field]: true },
      });
    } else {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Toggle setting error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
