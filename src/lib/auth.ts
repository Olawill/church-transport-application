import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import {
  admin,
  customSession,
  haveIBeenPwned,
  twoFactor,
} from "better-auth/plugins";

// import { env } from "@/env/server";
import { OTPChoice, UserRole, UserStatus } from "@/generated/prisma/enums";
import { prisma } from "./db";
import { extendUserSession } from "./session/extend-user-session";
import { OTP } from "@/config/constants";
import { sendMail } from "@/features/email/actions/sendEmail";
import { ac, CUSTOM_ROLES } from "./permissions";

const options = {
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        type: "forgot_password",
        name: user.name,
        verifyLink: url,
      });
    },
    onPasswordReset: async ({ user }) => {
      await sendMail({
        to: user.email,
        type: "password_change",
        name: user.name,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }, request) => {
      const referer = request?.headers.get("referer") as string;

      const fromProfile = referer?.includes("profile");
      await sendMail({
        to: user.email,
        type: "email_verification",
        name: user.name,
        verifyLink: url,
        message: fromProfile
          ? "For your security, we need to confirm that this email address belongs to you before enabling email notifications. Please use the button below to verify your email. Once confirmed, you will start receiving important updates and notifications from us. If you did not request this change, please ignore this email."
          : undefined,
      });
    },
  },
  // socialProviders: {
  //   facebook: {
  //     clientId: env.FACEBOOK_CLIENT_ID,
  //     clientSecret: env.FACEBOOK_CLIENT_SECRET,
  //   },
  //   google: {
  //     clientId: env.GOOGLE_CLIENT_ID,
  //     clientSecret: env.GOOGLE_CLIENT_SECRET,
  //   },
  // },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      phoneNumber: {
        type: "string",
      },
      whatsappNumber: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    haveIBeenPwned(),
    admin({
      ac,
      roles: { ...CUSTOM_ROLES },
      defaultRole: "USER",
      adminRoles: [
        "PLATFORM_ADMIN",
        "PLATFORM_SUPERUSER",
        "PLATFORM_USER",
        "ADMIN",
        "OWNER",
      ],
    }),
    twoFactor({
      otpOptions: {
        allowedAttempts: OTP.ALLOWED_ATTEMPTS,
        period: OTP.PERIOD,
        sendOTP: async ({ user, otp }) => {
          await sendMail({
            to: user.email,
            type: "otp",
            name: user.name,
            verifyCode: otp,
          });
        },
      },
    }),
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }) => {
      const {
        role,
        status,
        provider,
        isOauthSignup,
        needsCompletion,
        otpChoice,
        firstTimeLogin,
      } = await extendUserSession(session.userId);

      return {
        user: {
          ...user,
          role,
          status,
          provider,
          isOauthSignup,
          needsCompletion,
          otpChoice,
          firstTimeLogin,
        },
        session,
      };
    }, options),
    nextCookies(),
  ],
});

export type BaseSession = typeof auth.$Infer.Session;

export type ExtendedSession = {
  user: BaseSession["user"] & {
    role: UserRole;
    status: UserStatus;
    provider: string;
    isOauthSignup: boolean;
    needsCompletion: boolean;
    otpChoice: OTPChoice | null;
  };
  session: BaseSession["session"];
};
