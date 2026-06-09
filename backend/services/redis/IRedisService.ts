/**
 * Redis Service Interface
 * Defines the contract that all Redis adapters must implement
 */

export interface IRedisService {
  /**
   * Get a value from Redis
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value in Redis
   */
  set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void>;

  /**
   * Increment a value in Redis
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
   * Check if Redis connection is healthy
   */
  ping(): Promise<boolean>;

  /**
   * Close the connection
   */
  disconnect(): Promise<void>;
}

/**
 * Redis Provider Types
 */
export type RedisProvider = "local" | "upstash";
