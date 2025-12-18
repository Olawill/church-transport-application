import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    NEXTAUTH_URL: z.url(),
    NEXTAUTH_SECRET: z.string().min(1),
    LOCATIONIQ_API_KEY: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    FACEBOOK_CLIENT_ID: z.string().min(1),
    FACEBOOK_CLIENT_SECRET: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().min(1),
    ARCJET_KEY: z.string().min(1),
    APPEAL_TOKEN_SECRET: z.string().min(1),
  },
  experimental__runtimeEnv: process.env,
});
