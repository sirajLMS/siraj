import { Redis } from "@upstash/redis";
import logger from "@/backend/lib/logger";
import type { IRedisService } from "./IRedisService";

/**
 * Upstash Redis Adapter
 * Uses Upstash's serverless Redis service
 * Perfect for serverless production deployments (Vercel, Netlify, etc.)
 * Requires HTTPS URL and REST API token
 */
export class UpstashRedisAdapter implements IRedisService {
  private readonly client: Redis;

  constructor(url: string, token: string) {
    if (!url.startsWith("https://")) {
      throw new Error("Upstash Redis requires HTTPS URL. " + "Get your URL from https://console.upstash.com/");
    }

    if (!token) {
      throw new Error("Upstash Redis requires a token");
    }

    this.client = new Redis({
      url,
      token,
    });

    logger.log("✅ Initialized Upstash Redis adapter");
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void> {
    if (options?.ex) {
      await this.client.set(key, value, { ex: options.ex });
    } else if (options?.px) {
      await this.client.set(key, value, { px: options.px });
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

  async pipeline(commands: Array<{ command: string; args: string[] | number[] }>): Promise<unknown[]> {
    const pipeline = this.client.pipeline();

    for (const cmd of commands) {
      (pipeline as unknown as Record<string, (...args: (string | number)[]) => unknown>)[cmd.command](...cmd.args);
    }

    const results = await pipeline.exec();
    return results;
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  disconnect(): Promise<void> {
    // Upstash is REST-based, no persistent connection to close
    logger.log("Upstash Redis adapter closed (no persistent connection)");
    return Promise.resolve();
  }

  /**
   * Get the native Upstash client for advanced operations
   */
  getNativeClient(): Redis {
    return this.client;
  }
}
