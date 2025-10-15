"use server";

import { signIn, signOut } from "@/auth";
import { loginSchema, LoginSchema } from "@/types/authSchemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

export const signInAction = async (values: LoginSchema) => {
  const validatedValues = loginSchema.safeParse(values);

  if (!validatedValues.success) {
    return {
      // errors: validatedValues.error.flatten().fieldErrors,
      errors: z.treeifyError(validatedValues.error).properties,
    };
  }

  const { email, password } = validatedValues.data;
  // const result = await signIn("credentials", {
  //   email,
  //   password,
  //   // redirect: false,
  //   redirectTo: "/dashboard",
  // });

  // return { result };
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard", // Let NextAuth handle the redirect
    });
  } catch (error) {
    // signIn throws on successful redirect, so we need to handle this
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      // This is expected behavior for successful sign-in
      throw error;
    }
    // Return error for failed authentication
    return { error: "Invalid credentials" };
  }
};

export const signOutAction = async () => {
  await signOut({ redirect: false });
  revalidatePath("/", "layout");
  redirect("/login");
};
