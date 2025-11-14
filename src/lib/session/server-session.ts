"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";

export const getAuthSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
};

export const requireAuth = async () => {
  const session = await getAuthSession();

  // Get current path from headers (set in middleware)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

  // 1. No session at all - go to login
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
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

  // Get current path from headers (set in middleware)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/";

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
  }

  // User is fully authenticated and active - redirect to dashboard
  if (session.user.status === "APPROVED") {
    redirect("/dashboard");
  }
};
