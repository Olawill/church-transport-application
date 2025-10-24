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
    redirect("/login");
  }
};

export const requireNoAuth = async () => {
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }
};
