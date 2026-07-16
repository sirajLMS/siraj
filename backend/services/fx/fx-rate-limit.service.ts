import { logger } from "@/backend/lib/logger";
import { getRedisService } from "@/backend/services";

const RATE_LIMIT_WINDOW_SECONDS = 3600;
const RATE_LIMIT_MAX_REFRESHES = 3;

export namespace FxRateLimitService {
  export async function checkManualRefreshRateLimit(userId: string): Promise<void> {
    const key = `fx:refresh:rl:${userId}`;
    const redis = getRedisService();
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }
    if (current > RATE_LIMIT_MAX_REFRESHES) {
      logger.info("FX manual refresh rate limit exceeded", { userId, current });
      throw new Error("fxRefreshRateLimitExceeded");
    }
  }
}
