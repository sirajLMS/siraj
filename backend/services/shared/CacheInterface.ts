export interface CacheStats {
  provider: string;
  size: number;
  hitsByPrefix: Record<string, { hits: number; misses: number }>;
}

/**
 * Shared Cache/Redis Service Interface
 * Defines the contract for all cache and redis adapters
 */
export interface ICacheServiceBase {
  /**
   * Get a value from cache
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value in cache
   */
  set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void>;

  /**
   * Atomically set a value only if the key does NOT exist (SET NX),
   * with a TTL in milliseconds (PX).
   *
   * Returns `"OK"` if the key was set (caller is the first/owner).
   * Returns `null` if the key already exists (caller should defer).
   *
   * This is the atomic primitive used for TOCTOU-safe rate-limit slot claims.
   */
  setNx(key: string, value: string, pxMs: number): Promise<string | null>;

  /**
   * Increment a value in cache
   */
  incr(key: string): Promise<number>;

  /**
   * Set expiration time on a key
   */
  expire(key: string, seconds: number): Promise<void>;

  /**
   * Get time to live for a key
   */
  ttl(key: string): Promise<number>;

  /**
   * Delete a key
   */
  del(key: string): Promise<void>;

  /**
   * Execute a pipeline of commands (for atomic operations)
   */
  pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]>;

  /**
   * Check if cache connection is healthy
   */
  ping(): Promise<boolean>;

  /**
   * Close the connection
   */
  disconnect(): Promise<void>;

  /**
   * Get cache statistics and metrics
   */
  stats(): Promise<CacheStats>;
}
