import type { RedisSessionData } from "@/backend/types/auth/auth.types";

export interface SessionRedisSetOptions {
  sessionId: string;
  data: RedisSessionData;
  ttlSeconds: number;
}

/**
 * Interface for the session Redis service — used by the session repo to
 * avoid importing from `@/backend/services`. The concrete implementation
 * (`SessionRedisService`) lives in the service layer and is injected at startup.
 */
export interface ISessionRedisService {
  setSession(options: SessionRedisSetOptions): Promise<void>;
  getSession(sessionId: string): Promise<RedisSessionData | null>;
  touchSession(sessionId: string, ttlSeconds: number): Promise<boolean>;
  deleteSession(sessionId: string): Promise<void>;
  getUserSessions(userId: string): Promise<string[]>;
  deleteUserSessions(userId: string): Promise<number>;
  countUserSessions(userId: string): Promise<number>;
  enforceConcurrentLimit(userId: string, maxSessions: number): Promise<void>;
  getSessionTTL(sessionId: string): Promise<number>;
}

import type { rateLimitCache, sessionCache } from "@/backend/db/schema/shared/cache";

/** Cache entry types relocated from backend/db/schema/shared/cache.ts (R4 — schema files should export tables only). */
export type RateLimitCacheEntry = typeof rateLimitCache.$inferSelect;
export type SessionCacheEntry = typeof sessionCache.$inferSelect;
