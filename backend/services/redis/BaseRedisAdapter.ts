import type { IRedisService } from "./IRedisService";

/**
 * Base Redis Adapter to reduce duplication between different Redis implementations
 */
export abstract class BaseRedisAdapter<TClient> implements IRedisService {
  constructor(protected readonly client: TClient) {}

  abstract get(key: string): Promise<string | null>;
  abstract set(key: string, value: string, options?: { ex?: number; px?: number }): Promise<void>;
  abstract incr(key: string): Promise<number>;
  abstract expire(key: string, seconds: number): Promise<void>;
  abstract ttl(key: string): Promise<number>;
  abstract del(key: string): Promise<void>;
  abstract pipeline(commands: Array<{ command: string; args: (string | number)[] }>): Promise<unknown[]>;
  abstract ping(): Promise<boolean>;
  abstract disconnect(): Promise<void>;

  /**
   * Get the native client for advanced operations
   */
  getNativeClient(): TClient {
    return this.client;
  }
}
