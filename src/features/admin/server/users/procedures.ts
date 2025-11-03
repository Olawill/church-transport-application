import { UserRole } from "@/generated/prisma";
import { AnalyticsService } from "@/lib/analytics";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { geocodeAddress } from "@/lib/geocoding";
import { newUserSchema } from "@/schemas/adminCreateNewUserSchema";
import { createTRPCRouter, protectedRoleProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const adminUsersRouter = createTRPCRouter({
  getUsers: protectedRoleProcedure(UserRole.ADMIN).query(async () => {
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
  }),

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
      if (isLoginRequired) {
        if (!password || password.length < 8) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password must be at least 8 characters",
          });
        }

        const ctx = await auth.$context;
        hashedPassword = await ctx.password.hash(password);
      }

      // Get coordinates for addresses
      const coordinates = await geocodeAddress({
        street,
        city,
        province,
        postalCode,
        country: "Canada",
      });

      if (coordinates === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid address information",
        });
      }

      const newUser = await prisma.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          phoneNumber: phone || null,
          role: "USER",
          status: "APPROVED",
        },
        include: {
          accounts: {
            select: { id: true },
          },
        },
      });

      // Update password if login is required
      if (isLoginRequired && hashedPassword) {
        await prisma.account.update({
          where: { id: newUser.accounts[0].id, userId: newUser.id },
          data: { password: hashedPassword },
        });
      }

      // Create default address
      await prisma.address.create({
        data: {
          userId: newUser.id,
          name: "Home",
          street,
          city,
          province,
          postalCode,
          country: "Canada",
          latitude: coordinates?.latitude || null,
          longitude: coordinates?.longitude || null,
          isDefault: true,
        },
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
