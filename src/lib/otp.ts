import { OTPType } from "@/generated/prisma/enums";
import { prisma } from "./db";

export interface OTPOptions {
  userId: string;
  identifier: string; // email or phone
  type: OTPType;
  expiresInMinutes?: number;
}

export class OTPService {
  static async generateOTP({
    userId,
    identifier,
    type,
    expiresInMinutes = 10,
  }: OTPOptions): Promise<string> {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up old OTPs for this user and type
    await prisma.oTP.deleteMany({
      where: {
        userId,
        type,
        identifier,
      },
    });

    // Create new OTP
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    await prisma.oTP.create({
      data: {
        userId,
        code,
        type,
        identifier,
        expiresAt,
      },
    });

    return code;
  }

  static async verifyOTP(
    userId: string,
    code: string,
    type: OTPType,
    identifier: string
  ): Promise<boolean> {
    const otp = await prisma.oTP.findFirst({
      where: {
        userId,
        code,
        type,
        identifier,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otp) {
      // Increment attempts for existing OTP
      await prisma.oTP.updateMany({
        where: {
          userId,
          type,
          identifier,
          verified: false,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });
      return false;
    }

    // Mark as verified
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    // Update user verification status
    if (type === OTPType.EMAIL_VERIFICATION) {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });
    } else if (type === OTPType.PHONE_VERIFICATION) {
      await prisma.user.update({
        where: { id: userId },
        data: { phoneVerified: new Date() },
      });
    }

    return true;
  }

  static async isOTPValid(
    userId: string,
    type: OTPType,
    identifier: string
  ): Promise<boolean> {
    const otp = await prisma.oTP.findFirst({
      where: {
        userId,
        type,
        identifier,
        verified: false,
        expiresAt: {
          gt: new Date(),
        },
        attempts: {
          lt: 3, // Max 3 attempts
        },
      },
    });

    return !!otp;
  }

  static async cleanupExpiredOTPs(): Promise<void> {
    await prisma.oTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
