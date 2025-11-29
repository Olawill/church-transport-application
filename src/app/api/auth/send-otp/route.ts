import { auth } from "@/auth";
import { OTPType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { NotificationService } from "@/lib/notifications";
import { OTPService } from "@/lib/otp";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, identifier } = await request.json();

    // Validate request
    if (!type || !identifier) {
      return NextResponse.json(
        {
          error: "Type and identifier are required",
        },
        { status: 400 }
      );
    }

    if (!Object.values(OTPType).includes(type as OTPType)) {
      return NextResponse.json(
        {
          error: "Invalid OTP type",
        },
        { status: 400 }
      );
    }

    // Check rate limiting (max 3 OTPs per 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOTPs = await prisma.oTP.count({
      where: {
        userId: session.user.id,
        type: type as OTPType,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentOTPs >= 3) {
      return NextResponse.json(
        {
          error: "Too many OTP requests. Please wait before requesting again.",
        },
        { status: 429 }
      );
    }

    // Generate OTP
    const code = await OTPService.generateOTP({
      userId: session.user.id,
      identifier,
      type: type as OTPType,
      expiresInMinutes: 10,
    });

    // Send OTP
    if (type === OTPType.EMAIL_VERIFICATION) {
      await NotificationService.sendOTPNotification(
        session.user.id,
        code,
        "email"
      );
    } else if (type === OTPType.PHONE_VERIFICATION) {
      await NotificationService.sendOTPNotification(
        session.user.id,
        code,
        "whatsapp"
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
