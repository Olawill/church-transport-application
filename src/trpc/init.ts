import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { cache } from "react";
import superjson from "superjson";

import { UserRole } from "@/generated/prisma";
import {
  ajProtected,
  ajPublic,
  ajSensitive,
  handleArcjetDecision,
} from "@/lib/arcjet";
import { getAuthSession } from "@/lib/session/server-session";
import { initTRPC, TRPCError } from "@trpc/server";

export const createTRPCContext = cache(
  async (opts?: FetchCreateContextFnOptions) => {
    // return { userId: "user_123" };
    return { req: opts?.req };
  }
);

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  });

// Routers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const middleware = t.middleware;
export const baseProcedure = t.procedure;

// Request validation middleware - reusable
const requestMiddleware = middleware(({ ctx, next }) => {
  if (!ctx.req) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Request object not available",
    });
  }

  return next({ ctx: { ...ctx, req: ctx.req } });
});

// Auth middleware
const authMiddleware = middleware(async ({ ctx, next }) => {
  const session = await getAuthSession();
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }
  return next({ ctx: { ...ctx, auth: session } });
});

// Public rate limiting middleware (IP-based)
const publicMiddleware = middleware(async ({ ctx, next }) => {
  const decision = await ajPublic.protect(ctx.req!);

  handleArcjetDecision(decision);

  return next({ ctx });
});

// Protected procedure with arcjet
export const publicProcedure = baseProcedure
  .use(requestMiddleware)
  .use(publicMiddleware);

// Protected rate limiting middleware (userId-based)
export const protectedProcedure = baseProcedure
  .use(requestMiddleware)
  .use(authMiddleware)
  .use(async ({ ctx, next }) => {
    const userId = ctx.auth?.user?.id;

    const decision = await ajProtected.protect(ctx.req!, {
      userId,
      requested: 1,
    });

    handleArcjetDecision(decision);

    return next({ ctx });
  });

// Sensitive operations middleware (stricter limits: password changes, etc.)
export const sensitiveProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const userId = ctx.auth?.user?.id;

    const decision = await ajSensitive.protect(ctx.req!, {
      userId,
    });

    handleArcjetDecision(decision);

    return next({ ctx });
  }
);

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
