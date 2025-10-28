import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/env/server";
import { prisma } from "./db";
import { extendUserSession } from "./session/extend-user-session";

export const auth = betterAuth({
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
  plugins: [
    customSession(async ({ user, session }) => {
      const { role, status } = await extendUserSession(session.userId);

      return {
        user: {
          ...user,
          role,
          status,
        },
        session,
      };
    }),
    nextCookies(),
  ],
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
});
