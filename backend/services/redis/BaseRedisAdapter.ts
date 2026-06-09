import type { IRedisService } from "./IRedisService";
import { buildRedisPipeline } from "./redis-utils";

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
}

/**
 * Base Redis Adapter to reduce duplication between different Redis implementations
 */
export abstract class BaseRedisAdapter<TClient> implements IRedisService {
  constructor(protected readonly client: TClient) {}

  private get clientRef(): RedisClient {
    return this.client as unknown as RedisClient;
  }

  async get(key: string): Promise<string | null> {
    return await this.clientRef.get(key);
  }

  async set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void> {
    const client = this.clientRef;
    if (options?.ex) {
      if (typeof client.quit === "function") {
        await client.set(key, value, "EX", options.ex);
      } else {
        await client.set(key, value, { ex: options.ex });
      }
    } else if (options?.px) {
      if (typeof client.quit === "function") {
        await client.set(key, value, "PX", options.px);
      } else {
        await client.set(key, value, { px: options.px });
      }
    } else {
      await client.set(key, value);
    }
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
    const pipeline = buildRedisPipeline(this.clientRef.pipeline(), commands);
    const results = await pipeline.exec();

    if (!results) return [];

    // ioredis returns results as [error, result][]
    // Upstash returns results as result[]
    // We unify this by mapping ioredis results to throw on error
    const isIoRedis = typeof this.clientRef.on === "function";

    if (isIoRedis && Array.isArray(results)) {
      return results.map((res: unknown) => {
        if (Array.isArray(res) && res.length === 2) {
          const [err, result] = res as [unknown, unknown];
          if (err) throw err;
          return result;
        }
        return res;
      });
    }

    return results;
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
   * Get the native client for advanced operations
   */
  getNativeClient(): TClient {
    return this.client;
  }
}
