import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loginSchema, signupSchema } from "@/schemas/authSchemas";

import { comparePassword } from "@/lib/compare-password";
import { geocodeAddress } from "@/lib/geocoding";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  session: publicProcedure.query(async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session;
  }),

  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    const { email, password } = input;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (user.status !== "APPROVED") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message:
          "You cannot sign in at the moment, Please contact your administrator.",
      });
    }

    const data = await auth.api.signInEmail({
      body: { email, password, callbackURL: "/dashboard" },
      headers: await headers(),
    });

    return data;
  }),

  register: publicProcedure.input(signupSchema).mutation(async ({ input }) => {
    const {
      firstName,
      lastName,
      street,
      city,
      province,
      postalCode,
      country,
      confirmPassword,
      ...otherFields
    } = input;

    const samePassword = await comparePassword(
      otherFields.password,
      confirmPassword
    );

    if (!samePassword) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Your passwords do not match",
      });
    }

    const name = `${firstName} ${lastName}`;

    // Get coordinates for address
    const coordinates = await geocodeAddress({
      street,
      city,
      province,
      postalCode,
      country,
    });

    if (coordinates == null) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid address information",
      });
    }

    const data = await auth.api.signUpEmail({
      body: { name, ...otherFields, callbackURL: "/login" },
      //   headers: await headers(),
    });

    if (!data) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User registration failed",
      });
    }

    // Create user address
    await prisma.address.create({
      data: {
        userId: data.user.id,
        name: "Home", // TODO: Change to dynamic name
        street,
        city,
        province,
        postalCode,
        country,
        isDefault: true,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
    });

    return data;
  }),
});
