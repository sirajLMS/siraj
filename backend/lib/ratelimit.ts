import { getBooleanEnv } from "@/backend/lib/env";
import logger from "@/backend/lib/logger";
import { isTestHelperEnabled } from "@/backend/lib/test-helper-gate";
import { cacheService } from "@/backend/services/cache";

/**
 * Rate limiting configuration for API endpoints
 * Uses cache service (Redis or PostgreSQL) for distributed rate limiting across multiple instances
 * Implements sliding window algorithm for accurate rate limiting
 */

/**
 * Rate Limiter Class
 * Custom implementation using our cache service interface
 */
class RateLimiter {
  private readonly prefix: string;
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly _failOpen: boolean;

  constructor(prefix: string, maxRequests: number, windowMs: number, failOpen = true) {
    this.prefix = prefix;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this._failOpen = failOpen;
  }

  get isFailOpen(): boolean {
    return this._failOpen;
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

      // Remove old entries outside the window
      await cacheService.pipeline([
        { command: "zremrangebyscore", args: [key, 0, windowStart] },
        { command: "zadd", args: [key, now, requestId] },
        { command: "zcard", args: [key] },
        { command: "expire", args: [key, Math.ceil(this.windowMs / 1000)] },
      ]);

      // Count requests in current window
      const count = await this.getCount(key);
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
        success: this._failOpen,
        limit: this.maxRequests,
        remaining: this._failOpen ? this.maxRequests : 0,
        reset: now + this.windowMs,
      };
    }
  }

  /**
   * Get current request count for a key
   * Uses ZCARD to count members in the sorted set
   */
  private async getCount(key: string): Promise<number> {
    try {
      const results = await cacheService.pipeline([
        { command: "zremrangebyscore", args: [key, 0, Date.now() - this.windowMs] },
        { command: "zcard", args: [key] },
      ]);
      // zcard result is the second item in the pipeline results
      const count = results?.[1];
      return typeof count === "number" ? count : 0;
    } catch {
      return 0;
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
      const current = await cacheService.get(key);
      const count = current ? Number.parseInt(current, 10) : 0;

      if (count === 0) {
        // First request in window
        await cacheService.set(key, "1", { ex: ttlSeconds });
        return {
          success: true,
          limit: this.maxRequests,
          remaining: this.maxRequests - 1,
          reset: now + this.windowMs,
        };
      }

      if (count >= this.maxRequests) {
        // Limit exceeded
        const ttl = await cacheService.ttl(key);
        return {
          success: false,
          limit: this.maxRequests,
          remaining: 0,
          reset: now + ttl * 1000,
        };
      }

      // Increment counter
      await cacheService.incr(key);
      const ttl = await cacheService.ttl(key);

      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - (count + 1),
        reset: now + ttl * 1000,
      };
    } catch (error) {
      logger.error("Rate limiting error:", error);
      return {
        success: this._failOpen,
        limit: this.maxRequests,
        remaining: this._failOpen ? this.maxRequests : 0,
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
 * Prevents brute force attacks
 */
export const authRateLimiter = new RateLimiter(
  "ratelimit:auth",
  10,
  15 * 60 * 1000, // 15 minutes
  true
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
  limiter: RateLimiter = graphqlRateLimiter
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
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
    if (!limiter.isFailOpen) {
      return { success: false, limit: 0, remaining: 0, reset: 0 };
    }
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}

/**
 * Extract client identifier from request
 * Uses IP address, with fallback to a default identifier
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare

  // Use the first available IP
  const ip = cfConnectingIp || realIp || forwardedFor?.split(",")[0] || "127.0.0.1";

  return ip.trim();
}
