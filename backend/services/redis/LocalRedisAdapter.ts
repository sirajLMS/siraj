import Redis from "ioredis";
import logger from "@/backend/lib/logger";
import type { IRedisService } from "./IRedisService";
import { buildRedisPipeline } from "./redis-utils";

/**
 * Local Redis Adapter
 * Uses ioredis to connect to a local or self-hosted Redis instance
 * Perfect for development and self-hosted production environments
 */
export class LocalRedisAdapter implements IRedisService {
  private readonly client: Redis;

  constructor(url: string = "redis://localhost:6379") {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        logger.error("Redis connection error:", err.message);
        return true;
      },
    });

    this.client.on("connect", () => {
      logger.log("✅ Connected to local Redis");
    });

    this.client.on("error", (err: Error) => {
      logger.error("❌ Redis error:", err.message);
    });

    this.client.on("ready", () => {
      logger.log("🚀 Redis is ready");
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void> {
    if (options?.ex) {
      await this.client.set(key, value, "EX", options.ex);
    } else if (options?.px) {
      await this.client.set(key, value, "PX", options.px);
    } else {
      await this.client.set(key, value);
    }
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]> {
    const pipeline = buildRedisPipeline(this.client.pipeline(), commands);
    const results = await pipeline.exec();
    return (
      results?.map(([err, result]) => {
        if (err) throw err;
        return result;
      }) || []
    );
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    logger.log("Disconnected from Redis");
  }

  /**
   * Get the native ioredis client for advanced operations
   */
  getNativeClient(): Redis {
    return this.client;
  }
}
