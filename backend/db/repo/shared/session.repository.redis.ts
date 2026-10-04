import { getEnvironmentConfig } from "@/backend/lib/env";
import type { ISessionRedisService } from "@/backend/types";

// Injected from the service layer — avoids importing @/backend/services.
// The service layer registers a lazy factory so the Redis connection is
// established on first use rather than at module load time.
let redisServiceFactory: (() => Promise<ISessionRedisService>) | null = null;
let cachedRedisService: ISessionRedisService | null = null;

export function setSessionRedisServiceFactory(factory: () => Promise<ISessionRedisService>): void {
  redisServiceFactory = factory;
}

/**
 * Whether sessions should use Redis.
 */
export function redisSessionsEnabled(): boolean {
  return getEnvironmentConfig().cacheProvider !== "postgres";
}

export async function getSessionRedisService(): Promise<ISessionRedisService> {
  if (cachedRedisService) {
    return cachedRedisService;
  }
  if (!redisServiceFactory) {
    throw new Error(
      "SessionRedisService factory has not been registered. Call setSessionRedisServiceFactory() from the service layer."
    );
  }
  cachedRedisService = await redisServiceFactory();
  return cachedRedisService;
}
