import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { customSession, haveIBeenPwned, twoFactor } from "better-auth/plugins";

import { APP_NAME } from "@/config/constants";
import { env } from "@/env/server";
import { UserRole, UserStatus } from "@/generated/prisma";
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
    minPasswordLength: 5,
    // requireEmailVerification: true,
  },
  socialProviders: {
    facebook: {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    },
    google: {
      prompt: "select_account",
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
  plugins: [haveIBeenPwned(), twoFactor(), nextCookies()],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  appName: APP_NAME,
  ...options,
  // emailVerification
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }) => {
      const {
        role,
        status,
        provider,
        accessToken,
        isOAuthSignup,
        needsCompletion,
      } = await extendUserSession(session.userId);

      return {
        user: {
          ...user,
          role,
          status,
          provider,
          accessToken,
          isOAuthSignup,
          needsCompletion,
        },
        session,
      };
    }, options),
  ],
});

export type BaseSession = typeof auth.$Infer.Session;

export type ExtendedSession = {
  user: BaseSession["user"] & {
    role: UserRole;
    status: UserStatus;
    provider: string;
    accessToken: string | null;
    isOAuthSignup: boolean;
    needsCompletion: boolean;
  };
  session: BaseSession["session"];
};
