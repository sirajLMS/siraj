import crypto from "node:crypto";
import { isIP } from "node:net";
import { getBooleanEnv } from "@/backend/lib/env";
import { sanitizeForwardedFor } from "@/backend/lib/ip-utils";
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
 * Ensures a rate-limit key has a TTL set. On the first increment (count === 1),
 * sets the TTL via `cacheService.expire`. If that fails, retries with the max
 * TTL safeguard; if both attempts fail, deletes the key so it can't persist
 * forever (r10-004 mitigation).
 */
async function ensureRateLimitTtl(key: string, ttlSeconds: number): Promise<void> {
  const safeTtl = Math.min(ttlSeconds, MAX_TTL_SECONDS);
  try {
    await cacheService.expire(key, safeTtl);
  } catch (expireError) {
    logger.error("Rate limit TTL set failed on first increment (r10-004):", expireError);
    try {
      await cacheService.expire(key, MAX_TTL_SECONDS);
    } catch {
      try {
        await cacheService.del(key);
      } catch (delError) {
        logger.error("Rate limit key cleanup failed (r10-004):", delError);
      }
    }
  }
}

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
  async limit(
    identifier: string,
    options?: { failOpen?: boolean }
  ): Promise<{
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
      const failOpen = options?.failOpen ?? this.failOpen;
      return {
        success: failOpen,
        limit: this.maxRequests,
        remaining: failOpen ? this.maxRequests : 0,
        reset: now + this.windowMs,
      };
    }
  }

  /**
   * Simple counter-based rate limiting (fallback)
   */
  async limitSimple(
    identifier: string,
    options?: { failOpen?: boolean }
  ): Promise<{
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
      if (count === 1) {
        await ensureRateLimitTtl(key, ttlSeconds);
      }

      const remaining = Math.max(0, this.maxRequests - count);
      const success = count <= this.maxRequests;
      const reset = now + this.windowMs;

      return { success, limit: this.maxRequests, remaining, reset };
    } catch (error) {
      logger.error("Rate limiting error:", error);
      const failOpen = options?.failOpen ?? this.failOpen;
      return {
        success: failOpen,
        limit: this.maxRequests,
        remaining: failOpen ? this.maxRequests : 0,
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
 * Parses a positive integer env override. Returns the fallback when unset or
 * invalid, so a typo in configuration can never disable or zero a limiter.
 */
function getPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Authentication endpoints rate limiter (more restrictive)
 * Defaults to 10 login attempts per 15 minutes per IP address
 * Prevents brute force attacks.
 *
 * Overridable via `AUTH_RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_WINDOW_MS`
 * (milliseconds) for demo deployments that share one egress IP among many testers.
 *
 * Security note (r10-004): failOpen is set to FALSE so that if the cache
 * backend (Redis/PostgreSQL) is unavailable, authentication rate limiting
 * fails CLOSED — rejecting requests rather than allowing unbounded brute-force
 * attempts. Auth brute-force protection must never be silently disabled.
 */
export const authRateLimiter = new RateLimiter(
  "ratelimit:auth",
  getPositiveIntEnv("AUTH_RATE_LIMIT_MAX", 10),
  getPositiveIntEnv("AUTH_RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
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
 * Client-log ingestion rate limiter (`POST /api/logs`).
 * Allows 30 batches per minute per authenticated user — enough headroom for a
 * client recovering a buffered log stream, low enough that the endpoint cannot
 * be used for unbounded disk-write amplification (security review M1).
 * failOpen: true — log ingestion is diagnostic, not security-critical; the
 * endpoint's batch cap and message truncation bound worst-case damage even
 * when the limiter fails open.
 */
export const clientLogsRateLimiter = new RateLimiter(
  "ratelimit:client-logs",
  30,
  60 * 1000, // 1 minute
  true
);

/**
 * Export rate limiter for CPU-heavy document generation (CSV/XLSX/PDF routes
 * under app/api/*\/export). 10 exports per 10 minutes per user — generous for
 * interactive reporting, tight enough to stop a compromised account from
 * saturating server CPU with report jobs.
 */
export const exportRateLimiter = new RateLimiter(
  "ratelimit:export",
  10,
  10 * 60 * 1000, // 10 minutes
  false
);

/**
 * Storage upload rate limiter. Applies at upload-token mint and at the signed
 * upload PUT itself. 30 per minute per user — well above legitimate upload
 * bursts, caps DB-row/Vercel-API amplification.
 */
export const storageUploadRateLimiter = new RateLimiter(
  "ratelimit:storage-upload",
  30,
  60 * 1000, // 1 minute
  false
);

/**
 * OAuth callback rate limiter. Each callback hit triggers an outbound
 * provider token exchange, so cap per-IP to prevent outbound-request
 * amplification. 30 per 15 minutes per IP.
 */
export const oauthCallbackRateLimiter = new RateLimiter(
  "ratelimit:oauth-callback",
  30,
  15 * 60 * 1000, // 15 minutes
  true
);

/**
 * Cron endpoints rate limiter. Caps machine-to-machine cron trigger routes
 * (`/api/cron/*`, `/api/fx/refresh`) at 60 requests per minute per IP to slow
 * CRON_SECRET brute forcing and endpoint flooding.
 * Security note: failOpen is FALSE so cache outages fail closed, matching the
 * auth limiter — brute-force protection must never be silently disabled.
 */
export const cronRateLimiter = new RateLimiter(
  "ratelimit:cron",
  60,
  60 * 1000, // 1 minute
  false
);

/**
 * Log-safe view of a rate-limit identifier: client IPs are PII, so they are
 * logged as a short stable hash instead of in the clear.
 */
export function rateLimitLogId(identifier: string): string {
  if (isIP(identifier)) {
    return `ip:${crypto.createHash("sha256").update(identifier).digest("hex").slice(0, 12)}`;
  }
  return identifier;
}

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
    const { success, limit, remaining, reset } = await limiter.limitSimple(identifier, { failOpen });

    if (success) {
      return { success, limit, remaining, reset };
    }

    if (disableRateLimiting && (!isProduction || isTestHarness)) {
      return { success: true, limit, remaining, reset };
    }

    if (isDev && !disableRateLimiting) {
      const enforceRateLimit = getBooleanEnv("TEST_ENFORCE_RATE_LIMIT");
      if (enforceRateLimit) {
        logger.warn(
          `Rate limit exceeded for identifier: ${rateLimitLogId(identifier)} (TEST_ENFORCE_RATE_LIMIT=1, enforced in dev)`
        );
        return { success, limit, remaining, reset };
      }
      logger.warn(
        `Rate limit would have been exceeded for identifier: ${rateLimitLogId(identifier)} (development mode, not enforced)`
      );
      return { success: true, limit, remaining, reset };
    }

    logger.warn(`Rate limit exceeded for identifier: ${rateLimitLogId(identifier)}`);
    return { success, limit, remaining, reset };
  } catch (error) {
    logger.error("Rate limiting error:", error);
    if (!failOpen) {
      // Fail-closed: deny the request on cache errors (r6-sec-04)
      logger.warn(`Rate limit check failed (fail-closed) for identifier: ${rateLimitLogId(identifier)}`);
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
 *    reliable for identifying the actual client (r10-003). Only honored when
 *    `TRUSTED_PROXY=true`, i.e. the deployment sits behind a real reverse proxy
 *    that sets these headers (security review M2).
 * 4. `x-real-ip` — direct trusted proxy header. Only honored when
 *    `TRUSTED_PROXY=true` (M2).
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
 * When no IP header is present, production uses a single shared anonymous
 * bucket (fail-conservative — the header fingerprint is client-controlled
 * and would allow unbounded bucket rotation). A `logger.warn` is emitted so
 * missing-IP conditions are observable in production logs and operators can
 * set TRUSTED_PROXY=true for per-IP buckets. Outside production the fallback
 * includes a hash of `user-agent` and `accept-language` headers so dev/test
 * clients with different fingerprints are rate-limited separately.
 */

/**
 * Resolves the client IP from `x-forwarded-for` / `x-real-ip`, honored only
 * behind an explicitly trusted reverse proxy (TRUSTED_PROXY=true). Takes the
 * FIRST entry (leftmost = original client); the last entry could be an
 * attacker-controlled proxy hop (r10-003). Every candidate is validated with
 * isIP() so a spoofed non-IP value cannot be used to rotate rate-limit
 * buckets. Returns undefined when no valid IP is present.
 */
function resolveTrustedProxyClientIp(request: Request): string | undefined {
  // r10-003 / H4-parity: validate the first non-empty XFF entry with
  // isIP() so a spoofed non-IP XFF value cannot be used to rotate
  // rate-limit buckets. Mirrors gqlContextFactory.resolveTrustedProxyIp.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor
      .split(",")
      .map(s => s.trim())
      .find(s => s.length > 0 && isIP(s));
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    const trimmed = realIp.trim();
    if (trimmed && isIP(trimmed) > 0) {
      return trimmed;
    }
  }
  return undefined;
}

/**
 * Computes a stable per-client identifier for rate limiting: platform
 * trusted headers first (when the deployment is known to be on that
 * platform), then trusted-proxy headers, then a conservative fallback.
 * Missing-IP conditions are observable in production logs and operators can
 * set TRUSTED_PROXY=true for per-IP buckets. Outside production the fallback
 * includes a hash of `user-agent` and `accept-language` headers so dev/test
 * clients with different fingerprints are rate-limited separately.
 */
export function getClientIdentifier(request: Request): string {
  // Only trust platform-trusted headers when we know the deployment is on
  // that platform. Environment variables like VERCEL and CLOUDFLARE are set
  // by the platform infrastructure and cannot be spoofed by clients (r10-003).
  const isOnVercel = process.env.VERCEL === "1";
  const isBehindCloudflare = process.env.CLOUDFLARE === "1";

  if (isOnVercel) {
    // x-vercel-forwarded-for is set by Vercel's edge and trusted only on Vercel;
    // only a validated IP entry becomes a bucket key — a raw chain falls through.
    const vercelIp = sanitizeForwardedFor(request.headers.get("x-vercel-forwarded-for"));
    if (vercelIp) {
      return vercelIp;
    }
  }

  if (isBehindCloudflare) {
    const cfConnectingIp = sanitizeForwardedFor(request.headers.get("cf-connecting-ip"));
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
  }

  // x-forwarded-for / x-real-ip are only honored behind an explicitly trusted
  // reverse proxy (TRUSTED_PROXY=true). Otherwise they are client-spoofable and
  // enable rate-limit bucket rotation (security review M2). Take the FIRST entry
  // (leftmost = original client); the last entry could be an attacker-controlled
  // proxy hop (r10-003).
  if (getBooleanEnv("TRUSTED_PROXY")) {
    const trustedIp = resolveTrustedProxyClientIp(request);
    if (trustedIp) {
      return trustedIp;
    }
  }

  // r7-018: No IP header found. In production the header fingerprint below is
  // fully client-controlled (rotating user-agent/accept-language yields a
  // fresh bucket per request), so fail conservative: all unknown-IP clients
  // share one bucket. Set TRUSTED_PROXY=true (or deploy on Vercel/Cloudflare)
  // for per-IP buckets. Outside production the fingerprint keeps dev/test
  // clients separated.
  if (process.env.NODE_ENV === "production") {
    logger.warn("getClientIdentifier: no IP header found; using shared anonymous rate-limit bucket");
    return "anon:unknown";
  }

  logger.warn("getClientIdentifier: no IP header found; falling back to header-based fingerprint");
  const userAgent = request.headers.get("user-agent") ?? "";
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const fingerprint = crypto.createHash("sha256").update(`${userAgent}:${acceptLanguage}`).digest("hex").slice(0, 32);
  return `anon:${fingerprint}`;
}
