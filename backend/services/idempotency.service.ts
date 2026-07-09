import { CacheDbRepository } from "@/backend/db/repo/shared/cache.repository";

export namespace IdempotencyService {
  export const checkAndMark = async (key: string, userId: string): Promise<boolean> => {
    const cacheKey = `idempotency:${userId}:${key}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const wasInserted = await CacheDbRepository.insertIfNotExists(cacheKey, "used", expiresAt);

    return wasInserted;
  };

  export const release = async (key: string, userId: string): Promise<void> => {
    const cacheKey = `idempotency:${userId}:${key}`;
    await CacheDbRepository.del(cacheKey);
  };
}
