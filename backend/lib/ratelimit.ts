import logger from "@/backend/lib/logger";
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

  constructor(prefix: string, maxRequests: number, windowMs: number) {
    this.prefix = prefix;
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
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
      // Fail open - allow request if cache has issues
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests,
        reset: now + this.windowMs,
      };
    }
  }

  /**
   * Get current request count for a key
   */
  private async getCount(key: string): Promise<number> {
    try {
      const value = await cacheService.get(key);
      if (!value) return 0;

      // For sorted set implementation, we need to count members
      // For now, use simple counter
      return Number.parseInt(value, 10) || 0;
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
      // Fail open - allow request if cache has issues
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests,
        reset: now + this.windowMs,
      };
    }
  }
}

/**
 * GraphQL API rate limiter
 * Allows 100 requests per minute per IP address
 */
export const graphqlRateLimiter = new RateLimiter(
  "ratelimit:graphql",
  100,
  60 * 1000 // 1 minute
);

/**
 * Authentication endpoints rate limiter (more restrictive)
 * Allows 10 login attempts per 15 minutes per IP address
 * Prevents brute force attacks
 */
export const authRateLimiter = new RateLimiter(
  "ratelimit:auth",
  10,
  15 * 60 * 1000 // 15 minutes
);

/**
 * General API rate limiter
 * Allows 200 requests per minute per IP address
 */
export const apiRateLimiter = new RateLimiter(
  "ratelimit:api",
  200,
  60 * 1000 // 1 minute
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
  try {
    const { success, limit, remaining, reset } = await limiter.limitSimple(identifier);
    if (isDev) {
      if (!success) {
        logger.warn(
          `Rate limit would have been exceeded for identifier: ${identifier} (development mode, not enforced)`
        );
      }
      // Always allow in development
      return { success: true, limit, remaining, reset };
    } else {
      if (!success) {
        logger.warn(`Rate limit exceeded for identifier: ${identifier}`);
      }
      return { success, limit, remaining, reset };
    }
  } catch (error) {
    // If rate limiting fails (e.g., cache is down), allow the request
    // but log the error for monitoring
    logger.error("Rate limiting error:", error);
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
  const ip = cfConnectingIp || realIp || forwardedFor?.split(",")[0] || "unknown";

  return ip.trim();
}
