import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { OTPType } from "@/generated/prisma";
import { AnalyticsService } from "@/lib/analytics";
import { OTPService } from "@/lib/otp";

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, type, identifier } = await request.json();

    // Validate request
    if (!code || !type || !identifier) {
      return NextResponse.json(
        {
          error: "Code, type, and identifier are required",
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

    // Verify OTP
    const isValid = await OTPService.verifyOTP(
      session.user.id,
      code,
      type as OTPType,
      identifier
    );

    if (!isValid) {
      // Track failed verification attempt
      await AnalyticsService.trackEvent({
        eventType: "otp_verification_failed",
        userId: session.user.id,
        metadata: { type, identifier },
      });

      return NextResponse.json(
        {
          error: "Invalid or expired verification code",
        },
        { status: 400 }
      );
    }

    // Track successful verification
    await AnalyticsService.trackEvent({
      eventType: "otp_verification_success",
      userId: session.user.id,
      metadata: { type, identifier },
    });

    return NextResponse.json({
      success: true,
      message: "Verification successful",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
