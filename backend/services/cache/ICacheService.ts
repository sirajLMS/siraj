/**
 * Cache Service Interface
 * Defines the contract that all cache adapters must implement
 * Matches Redis operations used in rate limiting
 */

export interface ICacheService {
  /**
   * Get a value from cache
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value in cache
   */
  set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void>;

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
}

/**
 * Cache Provider Types
 */
export type CacheProvider = "redis" | "postgres";
