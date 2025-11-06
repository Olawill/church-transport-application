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
