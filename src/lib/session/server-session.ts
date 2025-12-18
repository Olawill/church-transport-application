"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import { redis } from "../redis";

export const getAuthSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
};

export const requireAuth = async () => {
  const session = await getAuthSession();

  if (!session) {
    // Get current path from headers (set in middleware)
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "/";
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  return session;
};

export const requireNoAuth = async () => {
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }
};

export const requireTwoFactorPending = async () => {
  const session = await getAuthSession();
  console.log({ session });

  // Must have a session
  if (!session?.user) {
    console.log("No User Session");
    redirect("/login");
  }

  // Must have 2FA enabled
  if (!session.user.twoFactorEnabled && session.user.firstTimeLogin) {
    console.log("2FA not enabled but already first time login");
    redirect("/dashboard");
  }

  // Check if user has a pending 2FA verification token
  const token = await redis.get(`2fa-pending:${session.user.id}`);

  if (!token) {
    console.log("No token");
    // No pending 2FA = either already verified or never initiated
    redirect("/dashboard");
  }

  return session;
};
