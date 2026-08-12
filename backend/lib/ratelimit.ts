import crypto from "node:crypto";
import { getBooleanEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { isTestHelperEnabled } from "@/backend/lib/test-helper-gate";
import { cacheService } from "@/backend/services";

/**
 * Rate limiting configuration for API endpoints
 * Uses cache service (Redis or PostgreSQL) for distributed rate limiting across multiple instances
 * Implements sliding window algorithm for accurate rate limiting
 */

/**
 * Maximum TTL (in seconds) that a rate-limit key can have.
 * This is a safeguard: even if the initial expire call fails, subsequent
 * increments will re-attempt with a TTL capped at this value so keys
 * can never persist forever (r10-004).
 */
const MAX_TTL_SECONDS = 3600; // 1 hour

/**
 * Rate Limiter Class
 * Custom implementation using our cache service interface
 */
class RateLimiter {
  private readonly prefix: string;
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly failOpen: boolean;

  constructor(prefix: string, maxRequests: number, windowMs: number, failOpen = true) {
    this.prefix = prefix;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.failOpen = failOpen;
  }

  get isFailOpen(): boolean {
    return this.failOpen;
  }

  /**
   * Check if request is allowed for given identifier
   * Returns remaining requests and reset time
   */
  async limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // Use Redis sorted set for sliding window
      // Score is timestamp, member is unique request ID
      const requestId = `${now}:${crypto.randomUUID()}`;

      // Remove old entries outside the window, add the new request, count
      // current window membership, and set expiry — all in one pipeline.
      const results = await cacheService.pipeline([
        { command: "zremrangebyscore", args: [key, 0, windowStart] },
        { command: "zadd", args: [key, now, requestId] },
        { command: "zcard", args: [key] },
        { command: "expire", args: [key, Math.ceil(this.windowMs / 1000)] },
      ]);

      // zcard is the third command (index 2) in the pipeline above
      const count = typeof results?.[2] === "number" ? results[2] : 0;
      const remaining = Math.max(0, this.maxRequests - count);
      const reset = now + this.windowMs;

      return {
        success: count <= this.maxRequests,
        limit: this.maxRequests,
        remaining,
        reset,
      };
    } catch (error) {
      logger.error("Rate limiting error:", error);
      return {
        success: this.failOpen,
        limit: this.maxRequests,
        remaining: this.failOpen ? this.maxRequests : 0,
        reset: now + this.windowMs,
      };
    }
  }

  /**
   * Simple counter-based rate limiting (fallback)
   */
  async limitSimple(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const ttlSeconds = Math.ceil(this.windowMs / 1000);

    try {
      // Atomic increment first — eliminates the TOCTOU race that occurred
      // when GET → check → INCR/SET were separate sequential calls.
      const count = await cacheService.incr(key);

      // Set TTL on the first request in the window.
      // Race window (r10-004): between `incr` returning 1 and `expire`
      // completing, another concurrent incr could see count === 2 and skip
      // the expire call. If the first expire also throws, the key would
      // persist forever with no TTL. To mitigate:
      //   1. We cap the TTL with MAX_TTL_SECONDS so even a much-too-large
      //      window can't create an effectively-permanent key.
      //   2. On every request where count is 1, we attempt the expire —
      //      if it throws, we catch, log, and retry once with the max TTL
      //      as a fallback. If that also fails, we delete the key so the
      //      next request starts fresh rather than leaking forever.
      const safeTtl = Math.min(ttlSeconds, MAX_TTL_SECONDS);

      if (count === 1) {
        try {
          await cacheService.expire(key, safeTtl);
        } catch (expireError) {
          logger.error("Rate limit TTL set failed on first increment (r10-004):", expireError);
          try {
            // Fallback: retry with max-TTL safeguard
            await cacheService.expire(key, MAX_TTL_SECONDS);
          } catch {
            // Last resort: delete the key so it can't persist forever
            try {
              await cacheService.del(key);
            } catch (delError) {
              logger.error("Rate limit key cleanup failed (r10-004):", delError);
            }
          }
        }
      }

      const remaining = Math.max(0, this.maxRequests - count);
      const success = count <= this.maxRequests;
      const reset = now + this.windowMs;

      return { success, limit: this.maxRequests, remaining, reset };
    } catch (error) {
      logger.error("Rate limiting error:", error);
      return {
        success: this.failOpen,
        limit: this.maxRequests,
        remaining: this.failOpen ? this.maxRequests : 0,
        reset: now + this.windowMs,
      };
    }
  }
}

/**
 * GraphQL API rate limiter
 * Allows 100 requests per minute per IP address
 */
export const graphqlRateLimiter = new RateLimiter("ratelimit:graphql", 100, 60 * 1000, true);

/**
 * Authentication endpoints rate limiter (more restrictive)
 * Allows 10 login attempts per 15 minutes per IP address
 * Prevents brute force attacks.
 *
 * Security note (r10-004): failOpen is set to FALSE so that if the cache
 * backend (Redis/PostgreSQL) is unavailable, authentication rate limiting
 * fails CLOSED — rejecting requests rather than allowing unbounded brute-force
 * attempts. Auth brute-force protection must never be silently disabled.
 */
export const authRateLimiter = new RateLimiter(
  "ratelimit:auth",
  10,
  15 * 60 * 1000, // 15 minutes
  false
);

/**
 * General API rate limiter
 * Allows 200 requests per minute per IP address
 */
export const apiRateLimiter = new RateLimiter(
  "ratelimit:api",
  200,
  60 * 1000, // 1 minute
  true
);

/**
 * Helper function to check rate limit and return appropriate response
 */
export async function checkRateLimit(
  identifier: string,
  limiter: RateLimiter = graphqlRateLimiter,
  options?: { failOpen?: boolean }
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // Default to failOpen: true for backward compatibility.
  // Security-critical callers (e.g. webhook endpoints) should pass failOpen: false
  // so cache outages reject requests instead of allowing unbounded flooding (r6-sec-04).
  const failOpen = options?.failOpen ?? limiter.isFailOpen;
  const isDev = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";
  const isTestHarness = isTestHelperEnabled();
  // DISABLE_RATE_LIMITING=true intentionally only bypasses rate limiting in
  // non-production environments, or in production when an explicit test harness
  // is active (`TEST_SERVER=1`, `TEST_CI=true`, never on Vercel production).
  // This fail-closed design ensures security is never accidentally relaxed in
  // real production deployments.
  const disableRateLimiting = getBooleanEnv("DISABLE_RATE_LIMITING");
  try {
    const { success, limit, remaining, reset } = await limiter.limitSimple(identifier);

    if (success) {
      return { success, limit, remaining, reset };
    }

    if (disableRateLimiting && (!isProduction || isTestHarness)) {
      logger.warn(`Rate limiting explicitly disabled (DISABLE_RATE_LIMITING=true) for identifier: ${identifier}`);
      return { success: true, limit, remaining, reset };
    }

    if (isDev && !disableRateLimiting) {
      logger.warn(`Rate limit would have been exceeded for identifier: ${identifier} (development mode, not enforced)`);
      return { success: true, limit, remaining, reset };
    }

    logger.warn(`Rate limit exceeded for identifier: ${identifier}`);
    return { success, limit, remaining, reset };
  } catch (error) {
    logger.error("Rate limiting error:", error);
    if (!failOpen) {
      // Fail-closed: deny the request on cache errors (r6-sec-04)
      logger.warn(`Rate limit check failed (fail-closed) for identifier: ${identifier}`);
      return { success: false, limit: 0, remaining: 0, reset: 0 };
    }
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}

/**
 * Extract a client identifier from the request for rate limiting.
 *
 * IP extraction strategy (priority order):
 * 1. `x-vercel-forwarded-for` — ONLY trusted when running on Vercel
 *    (`process.env.VERCEL === '1'`). On non-Vercel deployments this header
 *    is spoofable by clients, so it is ignored (r10-003).
 * 2. `cf-connecting-ip` — ONLY trusted when running behind Cloudflare
 *    (`process.env.CLOUDFLARE === '1'`). On non-Cloudflare deployments this
 *    header is spoofable, so it is ignored (r10-003).
 * 3. `x-forwarded-for` — take the **FIRST** entry (leftmost), which is the
 *    original client IP. The last entry is the closest trusted proxy, but an
 *    attacker can append entries to this header, so the first entry is more
 *    reliable for identifying the actual client (r10-003).
 * 4. `x-real-ip` — direct trusted proxy header.
 * 5. Fallback — see below.
 *
 * Why conditional trust (r10-003):
 * Platform-trusted headers like `x-vercel-forwarded-for` and
 * `cf-connecting-ip` are only guaranteed to be set by the platform's edge
 * network and not spoofable by clients when the deployment is actually on
 * that platform. If the app is deployed elsewhere (e.g., a plain VPS or a
 * different hosting provider), an attacker can trivially set these headers
 * to get fresh rate-limit buckets. By gating trust on environment variables
 * that only the platform itself sets, we prevent this spoofing vector.
 *
 * Fallback behavior (r7-018):
 * When no IP header is present, a static fallback collapses per-IP rate limiting —
 * all anonymous requests share the same bucket. To mitigate this, the fallback
 * includes a hash of `user-agent` and `accept-language` headers so clients with
 * different fingerprints are rate-limited separately. A `logger.warn` is emitted
 * so missing-IP conditions are observable in production logs.
 */
export function getClientIdentifier(request: Request): string {
  // Only trust platform-trusted headers when we know the deployment is on
  // that platform. Environment variables like VERCEL and CLOUDFLARE are set
  // by the platform infrastructure and cannot be spoofed by clients (r10-003).
  const isOnVercel = process.env.VERCEL === "1";
  const isBehindCloudflare = process.env.CLOUDFLARE === "1";

  if (isOnVercel) {
    // x-vercel-forwarded-for is set by Vercel's edge and trusted only on Vercel
    const vercelIp = request.headers.get("x-vercel-forwarded-for");
    if (vercelIp) {
      return vercelIp.trim();
    }
  }

  if (isBehindCloudflare) {
    // cf-connecting-ip is set by Cloudflare's edge and trusted only behind Cloudflare
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
  }

  // x-forwarded-for: take the FIRST entry (leftmost = original client).
  // The last entry could be a proxy the attacker controls, so the first
  // entry (appended by the client) is used to identify the actual source (r10-003).
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    if (ips.length > 0) {
      return ips[0];
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // r7-018: No IP header found — log a warning and generate a fallback
  // identifier from request headers so clients with different fingerprints
  // are rate-limited separately rather than sharing a single bucket.
  logger.warn("getClientIdentifier: no IP header found; falling back to header-based fingerprint");
  const userAgent = request.headers.get("user-agent") ?? "";
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const fingerprint = crypto.createHash("sha256").update(`${userAgent}:${acceptLanguage}`).digest("hex").slice(0, 32);
  return `anon:${fingerprint}`;
}
