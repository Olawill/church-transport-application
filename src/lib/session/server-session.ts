"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "../auth";
import { redis } from "../redis";

/**
 * -----------------------
 * Shared, deduped helpers
 * -----------------------
 */
export const getAuthSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
});

const getPathname = cache(async () => {
  // Get current path from headers (set in middleware)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  return pathname;
});

const getTwoFactorPendingToken = cache(async (userId: string) => {
  return redis.get(`2fa-pending:${userId}`);
});

/**
 * ---------------
 * Guards
 * ---------------
 */
export const requireAuth = async () => {
  const session = await getAuthSession();

  const pathname = await getPathname();

  // 1. No session at all - go to login
  if (!session) {
    redirect(
      pathname === "/"
        ? "/login"
        : `/login?redirect=${encodeURIComponent(pathname)}`,
    );
  }

  // 2. User needs to complete profile - go to complete-profile
  if (session.user.needsCompletion) {
    if (!pathname.startsWith("/complete-profile")) {
      redirect("/complete-profile");
    }

    // If already on complete-profile, allow access
    return session;
  }

  // 3. User is pending - go to waiting page
  if (session.user.status === "PENDING") {
    if (!pathname.startsWith("/pending-approval")) {
      redirect("/pending-approval");
    }
    return session;
  }

  // 4. User must be APPROVED to access protected routes
  if (session.user.status !== "APPROVED") {
    redirect("/login?error=account_status");
  }
  return session;
};

export const requireNoAuth = async () => {
  const session = await getAuthSession();

  if (!session) {
    // No session - allow access (user can see login/signup)
    return;
  }

  const pathname = await getPathname();

  // User needs to complete profile - redirect there
  if (session.user.needsCompletion) {
    if (!pathname.startsWith("/complete-profile")) {
      redirect("/complete-profile");
    }
    return; // Allow access to complete-profile
  }

  // User is pending approval - redirect to pending page
  if (session.user.status === "PENDING") {
    if (!pathname.startsWith("/pending-approval")) {
      redirect("/pending-approval");
    }
    return;
  }

  // User is fully authenticated and active - redirect to dashboard
  redirect("/dashboard");
};

export const requireTwoFactorPending = async () => {
  const session = await getAuthSession();

  // Must have a session
  if (!session?.user) {
    redirect("/login");
  }

  // Must have 2FA enabled
  if (!session.user.twoFactorEnabled && session.user.firstTimeLogin) {
    redirect("/dashboard");
  }

  // Check if user has a pending 2FA verification token
  const token = await getTwoFactorPendingToken(session.user.id);

  if (!token) {
    // No pending 2FA = either already verified or never initiated
    redirect("/dashboard");
  }

  return session;
};
