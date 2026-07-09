import Redis from "ioredis";
import logger from "@/backend/lib/logger";
import { BaseRedisAdapter } from "@/backend/services/redis/BaseRedisAdapter";

/**
 * Local Redis Adapter
 * Uses ioredis to connect to a local or self-hosted Redis instance
 * Perfect for development and self-hosted production environments
 */
export class LocalRedisAdapter extends BaseRedisAdapter<Redis> {
  constructor(url: string = "redis://localhost:6379") {
    const client = new Redis(url, {
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

    super(client);

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

  async disconnect(): Promise<void> {
    await this.client.quit();
    logger.log("Disconnected from Redis");
  }
}
