import { logger } from "@/backend/lib/logger";
import { cacheService } from "@/backend/services/cache";

const RATE_LIMIT_WINDOW_SECONDS = 3600;
const RATE_LIMIT_MAX_REFRESHES = 3;

export namespace FxRateLimitService {
  export async function checkManualRefreshRateLimit(userId: string): Promise<void> {
    const key = `fx:refresh:rl:${userId}`;
    // Use the provider-agnostic cacheService (Redis or PostgreSQL UNLOGGED tables,
    // selected via CACHE_PROVIDER env) instead of hardcoding getRedisService().
    // This avoids MaxRetriesPerRequestError when CACHE_PROVIDER=postgres and the
    // Redis instance is unreachable.
    const current = await cacheService.incr(key);
    if (current === 1) {
      await cacheService.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }
    if (current > RATE_LIMIT_MAX_REFRESHES) {
      logger.info("FX manual refresh rate limit exceeded", { userId, current });
      throw new Error("fxRefreshRateLimitExceeded");
    }
  }
}
