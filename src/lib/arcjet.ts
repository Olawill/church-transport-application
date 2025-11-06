import arcjet, {
  ArcjetBotCategory,
  ArcjetDecision,
  ArcjetWellKnownBot,
  detectBot,
  fixedWindow,
  shield,
  tokenBucket,
} from "@arcjet/next";

import { env } from "@/env/server";
import { TRPCError } from "@trpc/server";

const isDevelopment = process.env.NODE_ENV === "development";

const ALLOWED_BOTS = [
  "CATEGORY:SEARCH_ENGINE", // Essential for SEO
  "CATEGORY:MONITOR", // Essential for uptime monitoring
  "CATEGORY:PREVIEW", // Good for social media sharing
  // Note: Intentionally not including CATEGORY:AI to block AI scrapers
] as (ArcjetWellKnownBot | ArcjetBotCategory)[];

// For public routes (IP-based)
export const ajPublic = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["ip.src"], // Track by IP
  rules: [
    // Allow 100 requests per minute per IP
    fixedWindow({
      mode: isDevelopment ? "DRY_RUN" : "LIVE",
      window: "1m",
      max: 100,
    }),
    // Protect against common attacks
    shield({
      mode: isDevelopment ? "DRY_RUN" : "LIVE",
    }),
    // Block bots (allow search engines if needed)
    detectBot({
      mode: isDevelopment ? "DRY_RUN" : "LIVE",
      allow: ALLOWED_BOTS,
    }),
  ],
});

// For authenticated routes (userId-based)
export const ajProtected = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ["userId"], // Track by userId
  rules: [
    detectBot({
      mode: isDevelopment ? "DRY_RUN" : "LIVE",
      allow: ALLOWED_BOTS,
    }),
    // Smooth rate limiting for authenticated users
    tokenBucket({
      mode: isDevelopment ? "DRY_RUN" : "LIVE",
      refillRate: 20, // 20 tokens per interval
      interval: 10, // Every 10 seconds
      capacity: 50, // Can burst up to 50 requests
    }),
    shield({
      mode: isDevelopment ? "DRY_RUN" : "LIVE",
    }),
  ],
});

// For sensitive operations (stricter limits)
export const ajSensitive = arcjet({
  key: env.ARCJET_KEY!,
  characteristics: ["userId"],
  rules: [
    detectBot({
      mode: isDevelopment ? "DRY_RUN" : "LIVE",
      allow: ALLOWED_BOTS,
    }),
    fixedWindow({
      mode: isDevelopment ? "DRY_RUN" : "LIVE",
      window: "5m",
      max: 5, // Only 5 attempts per 5 minutes
    }),
    shield({
      mode: isDevelopment ? "DRY_RUN" : "LIVE",
    }),
  ],
});

// Helper to handle Arcjet decisions
export const handleArcjetDecision = (decision: ArcjetDecision) => {
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests. Please try again later.",
      });
    }

    if (decision.reason.isBot()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Bot detected.",
      });
    }

    if (decision.reason.isShield()) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Request blocked by security rules.",
      });
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Request blocked.",
    });
  }
};
