import { z } from "zod";

import { AnalyticsService } from "@/lib/analytics";
import { prisma } from "@/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

interface UpdatedDataType {
  name: string;
  username: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  image?: string | undefined;
}

export const userProfileRouter = createTRPCRouter({
  getUserProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.auth.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        username: true,
        image: true,
        whatsappNumber: true,
        twoFactorEnabled: true,
        emailNotifications: true,
        whatsAppNotifications: true,
        smsNotifications: true,
        emailVerified: true,
        phoneNumberVerified: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  updateUserProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        userName: z.string(),
        phone: z.string(),
        whatsappNumber: z.string(),
        image: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { firstName, lastName, userName, phone, whatsappNumber, image } =
        input;

      // Validate username uniqueness if provided
      if (userName) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: userName,
            id: { not: ctx.auth.user.id },
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Username already taken",
          });
        }
      }

      const updateData: UpdatedDataType = {
        name: `${firstName} ${lastName}`,
        username: userName || null,
        phoneNumber: phone || null,
        whatsappNumber: whatsappNumber || null,
      };

      // Handle image upload if provided
      //   if (image && image.size > 0) {
      if (image) {
        // TODO: Implement cloud storage for profile images
        // For now, we'll just store a placeholder
        updateData.image = `/uploads/profiles/${ctx.auth.user.id}-${Date.now()}.jpg`;
      }

      const updatedUser = await prisma.user.update({
        where: { id: ctx.auth.user.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          username: true,
          image: true,
          whatsappNumber: true,
          twoFactorEnabled: true,
          emailVerified: true,
          phoneNumberVerified: true,
          role: true,
          status: true,
        },
      });

      // Track analytics
      await AnalyticsService.trackEvent({
        eventType: "profile_update",
        userId: ctx.auth.user.id,
        metadata: { fields: Object.keys(updateData) },
      });

      return updatedUser;
    }),

  updateContact: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string(),
        whatsappNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { phoneNumber, whatsappNumber } = input;

      try {
        const updatedUser = await prisma.user.update({
          where: { id: ctx.auth.user.id },
          data: { phoneNumber, whatsappNumber },
          select: { id: true, phoneNumber: true, whatsappNumber: true },
        });

        // Track analytics
        await AnalyticsService.trackEvent({
          eventType: "profile_update",
          userId: ctx.auth.user.id,
          metadata: {
            fields: [
              "phoneNumber",
              whatsappNumber ? "whatsappNumber" : null,
            ].filter(Boolean),
            oauthCompletion: true,
          },
        });

        return { ...updatedUser, success: true };
      } catch (error) {
        console.error("Failed to update contact:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update contact information",
        });
      }
    }),
});
