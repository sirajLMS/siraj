/** Cache statistics returned by ICacheServiceBase.stats(). */
export interface CacheStats {
  provider: string;
  size: number;
  hitsByPrefix: Record<string, { hits: number; misses: number }>;
}

/**
 * Shared Cache/Redis Service Interface
 * Defines the contract for all cache and redis adapters.
 * Relocated from backend/services/shared/CacheInterface.ts (types-review R2).
 */
export interface ICacheServiceBase {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void>;
  setNx(key: string, value: string, pxMs: number): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
  del(key: string): Promise<void>;
  pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]>;
  ping(): Promise<boolean>;
  disconnect(): Promise<void>;
  stats(): Promise<CacheStats>;
}
