import { Redis } from "@upstash/redis";
import logger from "@/backend/lib/logger";
import { BaseRedisAdapter } from "@/backend/services/redis/BaseRedisAdapter";

/**
 * Upstash Redis Adapter
 * Uses Upstash's serverless Redis service
 * Perfect for serverless production deployments (Vercel, Netlify, etc.)
 * Requires HTTPS URL and REST API token
 */
export class UpstashRedisAdapter extends BaseRedisAdapter<Redis> {
  constructor(url: string, token: string) {
    if (!url.startsWith("https://")) {
      throw new Error("Upstash Redis requires HTTPS URL. " + "Get your URL from https://console.upstash.com/");
    }

    if (!token) {
      throw new Error("Upstash Redis requires a token");
    }

    const client = new Redis({
      url,
      token,
    });

    super(client);

    logger.log("✅ Initialized Upstash Redis adapter");
  }

  disconnect(): Promise<void> {
    // Upstash is REST-based, no persistent connection to close
    logger.log("Upstash Redis adapter closed (no persistent connection)");
    return Promise.resolve();
  }
}
