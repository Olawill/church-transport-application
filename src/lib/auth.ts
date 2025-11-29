import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { customSession, haveIBeenPwned, twoFactor } from "better-auth/plugins";

import { env } from "@/env/server";
import { OTPChoice, UserRole, UserStatus } from "@/generated/prisma/enums";
import { prisma } from "./db";
import { extendUserSession } from "./session/extend-user-session";

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
  },
  socialProviders: {
    facebook: {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
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
    twoFactor({
      otpOptions: {
        allowedAttempts: 3,
        sendOTP: async ({ user, otp }, request) => {
          console.log(
            `Sending OTP ${otp} to user ${user.email} via ${user.name}`
          );
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
