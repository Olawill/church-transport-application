import bcrypt from "bcryptjs";
import { NextAuthConfig, Session } from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";

import { UserRole } from "@/generated/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";

import { env } from "@/env/server";
import { AnalyticsService } from "./analytics";
import { prisma } from "./db";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
    }),
    Facebook({
      clientId: env.FACEBOOK_CLIENT_ID || "",
      clientSecret: env.FACEBOOK_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) return null;

        if (!user.password) {
          throw new Error("Please sign in with your social account");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        if (user.status === "BANNED") {
          throw new Error("Account has been banned");
        }

        if (user.status !== "APPROVED" && user.role !== UserRole.ADMIN) {
          throw new Error("Account pending approval");
        }

        if (!user.isActive) {
          throw new Error("Account is inactive");
        }

        // Get organization info for the user
        const userWithOrg = await prisma.user.findUnique({
          where: { id: user.id },
          include: { organization: true },
        });

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          image: user.image || undefined,
          organizationId: userWithOrg?.organizationId || undefined,
          organizationSlug: userWithOrg?.organization?.slug || undefined,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user with OAuth data
          const names = user.name?.split(" ") || ["", ""];
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              firstName: names[0] || "",
              lastName: names.slice(1).join(" ") || "",
              image: user.image,
              emailVerified: new Date(),
              role: UserRole.USER,
              status: "PENDING", // Still needs admin approval
            },
          });

          // Track OAuth user registration (initial account creation)
          await AnalyticsService.trackUserRegistration(
            newUser.id,
            "oauth",
            account?.provider
          );

          // Store user ID for the completion flow
          user.id = newUser.id;
          user.role = newUser.role;
          user.status = newUser.status;
          user.needsCompletion = true;
          user.isOAuthSignup = true; // Flag to identify OAuth signups
        } else {
          user.role = existingUser.role;
          user.status = existingUser.status;

          // Check if user needs to complete profile (no addresses)
          const addressCount = await prisma.address.count({
            where: { userId: existingUser.id, isActive: true },
          });
          user.needsCompletion = addressCount === 0;
          user.isOAuthSignup = false; // Existing user, not a new OAuth signup

          if (existingUser.status === "BANNED") {
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.needsCompletion = user.needsCompletion;
        token.isOAuthSignup = user.isOAuthSignup;
        token.organizationId = user.organizationId;
        token.organizationSlug = user.organizationSlug;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user = {
          ...session.user,
          id: token.sub!,
          role: token.role as UserRole,
          status: token.status as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
          needsCompletion: token.needsCompletion as boolean,
          isOAuthSignup: token.isOAuthSignup as boolean,
          organizationId: token.organizationId as string,
          organizationSlug: token.organizationSlug as string,
        };
      }
      return session;
    },
  },
};
