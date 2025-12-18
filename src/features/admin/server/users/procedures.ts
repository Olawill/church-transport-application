import { UserRole } from "@/generated/prisma/client";
import { AnalyticsService } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocoding";
import { newUserSchema } from "@/schemas/adminCreateNewUserSchema";
import { createTRPCRouter, protectedRoleProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const adminUsersRouter = createTRPCRouter({
  getUsers: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER]).query(
    async () => {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          bannedAt: true,
          banReason: true,
          isActive: true,
        },
        orderBy: [
          { status: "asc" }, // Pending first
          { createdAt: "desc" },
        ],
      });

      return users;
    }
  ),

  createUser: protectedRoleProcedure([UserRole.ADMIN, UserRole.OWNER])
    .input(newUserSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        firstName,
        lastName,
        email,
        phone,
        isLoginRequired,
        password,
        street,
        city,
        province,
        postalCode,
        country,
      } = input;

      // Check if user already exist
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User with this email already exists",
        });
      }

      //Hash password
      let hashedPassword: string | null = null;
      const authCtx = await auth.$context;
      if (isLoginRequired) {
        if (!password || password.length < 8) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password must be at least 8 characters",
          });
        }

        hashedPassword = await authCtx.password.hash(password);
      }

      // Get coordinates for addresses
      const coordinates = await geocodeAddress({
        street,
        city,
        province,
        postalCode,
        country,
      });

      if (coordinates === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid address information",
        });
      }

      const accountId = authCtx.generateId({ model: "account" });

      if (!accountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User account cannot be created",
        });
      }

      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: `${firstName} ${lastName}`,
            email,
            phoneNumber: phone || null,
            role: "USER",
            status: "APPROVED",
            isAdminCreated: true,
          },
        });

        // Create default address
        await tx.address.create({
          data: {
            userId: user.id,
            name: "Home",
            street,
            city,
            province,
            postalCode,
            country,
            latitude: coordinates?.latitude || null,
            longitude: coordinates?.longitude || null,
            isDefault: true,
          },
        });

        return user;
      });

      // Update password if login is required
      await authCtx.internalAdapter.createAccount({
        userId: newUser.id,
        providerId: "credential",
        accountId,
        password: hashedPassword || null,
      });

      // Track user creating by admin event
      await AnalyticsService.trackEvent({
        eventType: "admin_user_creation",
        userId: newUser.id,
        metadata: { createdBy: ctx.auth.user.id },
      });

      return {
        message: "User Created Successfully.",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          status: newUser.status,
        },
      };
    }),
});
