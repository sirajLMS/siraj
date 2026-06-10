import { CacheDbRepository } from "../db/repo/cache.repository";

export namespace IdempotencyService {
  /**
   * Check if an idempotency key has been used within the last 24 hours.
   * If not, mark it as used.
   * Returns true if the key is new, false if it has been used.
   */
  export const checkAndMark = async (key: string, userId: string): Promise<boolean> => {
    const cacheKey = `idempotency:${userId}:${key}`;
    const existing = await CacheDbRepository.get(cacheKey);

    if (existing) {
      return false;
    }

    // Mark as used for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await CacheDbRepository.set(cacheKey, "used", expiresAt);

    return true;
  };

  /**
   * Remove an idempotency key (e.g. if the request failed and we want to allow retry).
   */
  export const release = async (key: string, userId: string): Promise<void> => {
    const cacheKey = `idempotency:${userId}:${key}`;
    await CacheDbRepository.del(cacheKey);
  };
}
