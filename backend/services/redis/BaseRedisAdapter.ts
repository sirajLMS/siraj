import { getEntityCacheStats } from "@/backend/services/cache/EntityCacheService";
import type { IRedisService } from "@/backend/services/redis/IRedisService";
import { buildRedisPipeline } from "@/backend/services/redis/redis-utils";
import type { CacheStats } from "@/backend/services/shared/CacheInterface";

/**
 * Common interface for Redis clients (ioredis, upstash) to allow safe delegation
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  ttl(key: string): Promise<number>;
  del(key: string): Promise<unknown>;
  quit?(): Promise<unknown>;
  pipeline(): { exec(): Promise<unknown[] | null> };
  ping(): Promise<unknown>;
  on?(event: string, callback: (...args: unknown[]) => void): void;
  dbsize?(): Promise<number>;
}

/**
 * Type guard verifying that an unknown value structurally satisfies RedisClient.
 * Runtime checks replace unsafe type assertions so callers can safely narrow TClient
 * (ioredis.Redis / @upstash/redis Redis) to the RedisClient contract.
 */
function isRedisClient(client: unknown): client is RedisClient {
  if (typeof client !== "object" || client === null) return false;
  return (
    "get" in client &&
    typeof client.get === "function" &&
    "set" in client &&
    typeof client.set === "function" &&
    "incr" in client &&
    typeof client.incr === "function" &&
    "expire" in client &&
    typeof client.expire === "function" &&
    "ttl" in client &&
    typeof client.ttl === "function" &&
    "del" in client &&
    typeof client.del === "function" &&
    "pipeline" in client &&
    typeof client.pipeline === "function" &&
    "ping" in client &&
    typeof client.ping === "function"
  );
}

/**
 * Base Redis Adapter to reduce duplication between different Redis implementations
 */
export abstract class BaseRedisAdapter<TClient> implements IRedisService {
  constructor(protected readonly client: TClient) {}

  private get clientRef(): RedisClient {
    if (!isRedisClient(this.client)) {
      throw new Error("Invalid Redis client: missing required RedisClient methods");
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return await this.clientRef.get(key);
  }

  async set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void> {
    const client = this.clientRef;
    const isIoRedis = typeof client.quit === "function";

    if (options?.ex) {
      const args = isIoRedis ? ["EX", options.ex] : [{ ex: options.ex }];
      await client.set(key, value, ...args);
      return;
    }

    if (options?.px) {
      const args = isIoRedis ? ["PX", options.px] : [{ px: options.px }];
      await client.set(key, value, ...args);
      return;
    }

    await client.set(key, value);
  }

  async setNx(key: string, value: string, pxMs: number): Promise<string | null> {
    const client = this.clientRef;
    const isIoRedis = typeof client.quit === "function";

    if (isIoRedis) {
      // ioredis uses positional SET key value NX PX ms-string
      const result = await client.set(key, value, "NX", "PX", String(pxMs));
      return typeof result === "string" ? result : null;
    }

    // Upstash Redis uses an options object: { nx: true, px: ms-number }.
    // The RedisClient.set signature (...args: unknown[]) accepts the options object
    // without requiring an unsafe type assertion.
    const result = await client.set(key, value, { nx: true, px: pxMs });
    return typeof result === "string" ? result : null;
  }

  async incr(key: string): Promise<number> {
    const result = await this.clientRef.incr(key);
    return typeof result === "number" ? result : Number(result);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.clientRef.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    const result = await this.clientRef.ttl(key);
    return typeof result === "number" ? result : Number(result);
  }

  async del(key: string): Promise<void> {
    await this.clientRef.del(key);
  }

  async pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]> {
    const results = await buildRedisPipeline(this.clientRef.pipeline(), commands).exec();

    if (!results) return [];

    const isIoRedis = typeof this.clientRef.on === "function";
    if (!isIoRedis) return results;

    return results.map((res: unknown) => {
      if (Array.isArray(res) && res.length === 2) {
        const [err, result] = res;
        if (err) throw err;
        return result;
      }
      return res;
    });
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.clientRef.ping();
      return result === "PONG" || result === true;
    } catch {
      return false;
    }
  }

  abstract disconnect(): Promise<void>;

  /**
   * Get cache statistics and metrics
   */
  async stats(): Promise<CacheStats> {
    try {
      let size = 0;
      const client = this.clientRef;
      if (typeof client.dbsize === "function") {
        size = await client.dbsize();
      }
      return {
        provider: "redis",
        size,
        hitsByPrefix: getEntityCacheStats(),
      };
    } catch {
      return {
        provider: "redis",
        size: 0,
        hitsByPrefix: getEntityCacheStats(),
      };
    }
  }

  /**
   * Get the native client for advanced operations
   */
  getNativeClient(): TClient {
    return this.client;
  }
}
