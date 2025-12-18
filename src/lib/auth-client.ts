import { createAuthClient } from "better-auth/react";

import { env } from "@/env/client";
import type { auth } from "@/lib/auth";
import {
  adminClient,
  customSessionClient,
  inferAdditionalFields,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: env.NEXT_PUBLIC_APP_URL,
  plugins: [
    adminClient(),
    twoFactorClient(),
    inferAdditionalFields<typeof auth>(),
    customSessionClient<typeof auth>(),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  changePassword,
  useSession,
  requestPasswordReset,
  resetPassword,
  twoFactor,
} = authClient;
