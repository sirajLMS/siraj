import { createHash, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { checkRateLimit, cronRateLimiter, getClientIdentifier, rateLimitLogId } from "@/backend/lib/ratelimit";
import { getServerTranslations } from "@/shared/locale";

const CRON_SECRET_HEADER = "authorization";
const R11_EXPECTED_PREFIX = "Bearer ";

/** Cron API routes are machine-to-machine (Vercel Cron); default to English. */
function cronErrorMessages() {
  return getServerTranslations("en").dashboardTranslations.cron.errors;
}

function timingSafeSecretCompare(a: string, b: string): boolean {
  const aHash = createHash("sha256").update(a).digest();
  const bHash = createHash("sha256").update(b).digest();
  if (aHash.length !== bHash.length) return false;
  return timingSafeEqual(aHash, bHash);
}

export type CronAuthResult = { authorized: true } | { authorized: false; response: NextResponse };

export function verifyCronSecretAuth(request: NextRequest): CronAuthResult {
  // R3: GET only — callers must enforce method, but fail-closed for non-GET here too
  if (request.method !== "GET") {
    return {
      authorized: false,
      response: NextResponse.json({ error: cronErrorMessages().methodNotAllowed }, { status: 405 }),
    };
  }

  const config = getEnvironmentConfig();
  const cronSecret = config.cronSecret;

  // R1 / R1b: Production without CRON_SECRET → 500; any non-test env without secret → 401
  if (process.env.NODE_ENV === "production" && !cronSecret) {
    logger.error("CRON_SECRET missing in production for cron endpoint");
    return {
      authorized: false,
      response: NextResponse.json({ error: cronErrorMessages().serverMisconfigured }, { status: 500 }),
    };
  }

  // S7: require CRON_SECRET in dev too, except NODE_ENV=test
  if (process.env.NODE_ENV !== "test" && !cronSecret) {
    logger.warn("CRON_SECRET not set; cron endpoint unauthorized");
    return {
      authorized: false,
      response: NextResponse.json({ error: cronErrorMessages().unauthorized }, { status: 401 }),
    };
  }

  // R4: no query-string secret — only header
  const authHeader = request.headers.get(CRON_SECRET_HEADER);
  if (!authHeader?.startsWith(R11_EXPECTED_PREFIX)) {
    // R2: Bearer match fail-closed; constant-time
    return {
      authorized: false,
      response: NextResponse.json({ error: cronErrorMessages().unauthorized }, { status: 401 }),
    };
  }

  const provided = authHeader.slice(R11_EXPECTED_PREFIX.length);
  const expected = cronSecret ?? "";
  if (!provided || !expected || !timingSafeSecretCompare(provided, expected)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: cronErrorMessages().unauthorized }, { status: 401 }),
    };
  }

  // R6: log x-vercel-cron-schedule for audit only (no auth reliance on it)
  const schedule = request.headers.get("x-vercel-cron-schedule");
  if (schedule) {
    logger.info("Cron invocation received", { schedule });
  }

  return { authorized: true };
}

/**
 * Higher-order function that wraps a cron route handler with rate limiting and authentication.
 * Rate-limits requests per client IP to prevent CRON_SECRET brute forcing and endpoint flooding.
 * If rate limit or auth fails, the error `NextResponse` is returned immediately and the
 * handler is never called.
 *
 * Usage:
 * ```ts
 * export const maxDuration = 300;
 * export const GET = withCronAuth(async (request) => { ... });
 * ```
 */
export function withCronAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Rate-limit cron requests per IP before credential check to prevent secret brute-forcing and endpoint flooding
    const clientIdentifier = getClientIdentifier(request);
    const rateLimit = await checkRateLimit(`cron:${clientIdentifier}`, cronRateLimiter);
    if (!rateLimit.success) {
      logger.warn("Cron endpoint rate limit exceeded", { rateLimitLogId: rateLimitLogId(clientIdentifier) });
      return NextResponse.json(
        { error: getServerTranslations("en").errorsTranslations.rateLimitExceeded },
        { status: 429 }
      );
    }

    const authResult = verifyCronSecretAuth(request);
    if (!authResult.authorized) {
      return authResult.response;
    }
    return handler(request);
  };
}
