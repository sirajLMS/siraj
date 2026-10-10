import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { queryDb } from "@/backend/db";
import { logger } from "@/backend/lib/logger";
import { apiRateLimiter, checkRateLimit, getClientIdentifier, rateLimitLogId } from "@/backend/lib/ratelimit";

/**
 * Lightweight database liveness probe consumed by the full-screen
 * service-unavailable page (`app/error.tsx`) auto-retry loop and external
 * uptime monitors. Intentionally public: it reports only a coarse ok/
 * unavailable status and never exposes details.
 */
const PROBE_TIMEOUT_MS = 3_000;
const NO_STORE = { "Cache-Control": "no-store" };

function probeTimeout(): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("DB health probe timed out")), PROBE_TIMEOUT_MS);
  });
}

export async function GET(request: NextRequest) {
  const ip = getClientIdentifier(request);
  const rateLimitKey = `health-db:${ip}`;
  const rateLimit = await checkRateLimit(rateLimitKey, apiRateLimiter);
  if (!rateLimit.success) {
    logger.warn("DB health probe rate limit exceeded", { rateLimitLogId: rateLimitLogId(rateLimitKey) });
    return NextResponse.json({ status: "unavailable" }, { status: 429, headers: NO_STORE });
  }

  try {
    await Promise.race([queryDb().execute(sql`SELECT 1`), probeTimeout()]);
    return NextResponse.json({ status: "ok" }, { headers: NO_STORE });
  } catch (error) {
    logger.debug(`DB health probe failed: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}
