import { UserRole } from "@/generated/prisma";
import { getAuthSession } from "@/lib/session/server-session";
import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
  return { userId: "user_123" };
});

const t = initTRPC.create({
  transformer: superjson,
});

// Routers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await getAuthSession();

  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  return next({ ctx: { ...ctx, auth: session } });
});

export const protectedRoleProcedure = (role: UserRole | UserRole[]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    if (Array.isArray(role) && !role.includes(ctx.auth.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You do not have access to this resource`,
      });
    }
    if (!Array.isArray(role) && ctx.auth.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You do not have access to this resource`,
      });
    }

    return next({ ctx: { ...ctx } });
  });
