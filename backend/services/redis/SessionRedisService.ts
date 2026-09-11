// cspell:ignore: SADD, SREM, smembers, SCARD
import { logger } from "@/backend/lib/logger";
import type { IRedisService } from "@/backend/services/redis/IRedisService";
import type { ISessionRedisService, RedisSessionData, SessionRedisSetOptions } from "@/backend/types";

/**
 * Session Redis Service
 * Manages session storage and operations in Redis with TTL support
 */
export class SessionRedisService implements ISessionRedisService {
  private readonly keyPrefix = "session:";
  private readonly userSessionsKeyPrefix = "user_sessions:";

  constructor(private readonly redis: IRedisService) {}
  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private getNativeMethod(name: string): ((...args: unknown[]) => Promise<unknown>) | undefined {
    const redisAny = this.redis as unknown;
    if (!this.isRecord(redisAny)) return undefined;
    const getter = redisAny.getNativeClient;
    if (typeof getter !== "function") return undefined;
    const nativeClient = getter.call(redisAny);
    if (!this.isRecord(nativeClient)) return undefined;
    const method = nativeClient[name];
    return typeof method === "function" ? method.bind(nativeClient) : undefined;
  }

  /**
   * Generate Redis key for session
   */
  private getSessionKey(sessionId: string): string {
    return `${this.keyPrefix}${sessionId}`;
  }

  /**
   * Generate Redis key for user's session list
   */
  private getUserSessionsKey(userId: string): string {
    return `${this.userSessionsKeyPrefix}${userId}`;
  }

  /**
   * Store session in Redis with TTL
   */
  async setSession(options: SessionRedisSetOptions): Promise<void> {
    const { sessionId, data, ttlSeconds } = options;
    const key = this.getSessionKey(sessionId);
    const value = JSON.stringify(data);

    await this.redis.set(key, value, { ex: ttlSeconds });

    // Add session ID to user's session set (for tracking concurrent sessions)
    const userSessionsKey = this.getUserSessionsKey(data.userId);

    // cspell:disable-next-line -- Redis commands
    const sAdd = this.getNativeMethod("sadd");
    const expire = this.getNativeMethod("expire");

    if (sAdd && expire) {
      await sAdd(userSessionsKey, sessionId);
      await expire(userSessionsKey, ttlSeconds);
    }

    logger.debug("Session stored in Redis", { userId: data.userId });
  }

  /**
   * Validate the impersonation sub-object
   */
  private validateImpersonation(imp: unknown): boolean {
    if (imp === undefined) return true;
    if (!this.isRecord(imp)) return false;
    return (
      typeof imp.targetUserId === "string" &&
      typeof imp.startedAt === "string" &&
      typeof imp.expiresAt === "string" &&
      typeof imp.impersonationSessionId === "string" &&
      (imp.reason === undefined || typeof imp.reason === "string")
    );
  }

  /**
   * Validate the groupSimulation sub-object
   */
  private validateGroupSimulation(gsim: unknown): boolean {
    if (gsim === undefined) return true;
    if (!this.isRecord(gsim)) return false;
    return (
      typeof gsim.groupSlug === "string" && typeof gsim.startedAt === "string" && typeof gsim.expiresAt === "string"
    );
  }

  /**
   * Validate that parsed data conforms to RedisSessionData shape.
   * Prevents corrupted/tampered Redis data from bypassing type assertions.
   */
  private validateSessionData(data: unknown, _sessionId: string): data is RedisSessionData {
    if (!this.isRecord(data)) {
      return false;
    }

    // Required primary fields
    const hasRequired =
      typeof data.userId === "string" &&
      typeof data.hashedId === "string" &&
      typeof data.payload === "string" &&
      typeof data.createdAt === "string" &&
      typeof data.lastActivityAt === "string";

    if (!hasRequired) {
      return false;
    }

    // Optional metadata string fields
    const hasValidMetadata =
      (data.ipAddress === undefined || typeof data.ipAddress === "string") &&
      (data.userAgent === undefined || typeof data.userAgent === "string") &&
      (data.deviceType === undefined || typeof data.deviceType === "string") &&
      (data.deviceName === undefined || typeof data.deviceName === "string");

    if (!hasValidMetadata) {
      return false;
    }

    return this.validateImpersonation(data.impersonation) && this.validateGroupSimulation(data.groupSimulation);
  }

  /**
   * Get session from Redis
   */
  async getSession(sessionId: string): Promise<RedisSessionData | null> {
    const key = this.getSessionKey(sessionId);
    const value = await this.redis.get(key);

    if (!value) {
      return null;
    }

    try {
      // Handles raw JSON string (standard Redis behavior) and fallback object if auto-deserialized.
      // Avoids JSON.parse([object Object]) SyntaxError if value is already a parsed object.
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (!this.validateSessionData(parsed, sessionId)) {
        logger.error(`Session data validation failed for ${sessionId} — data shape does not match RedisSessionData`);
        return null;
      }
      return parsed;
    } catch (error) {
      logger.error(`Failed to parse session data for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Update session's last activity timestamp and extend TTL
   */
  async touchSession(sessionId: string, ttlSeconds: number): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    // Update last activity
    session.lastActivityAt = new Date().toISOString();

    // Re-store with new TTL
    await this.setSession({ sessionId, data: session, ttlSeconds });

    return true;
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (session) {
      // Remove from user's session set
      const userSessionsKey = this.getUserSessionsKey(session.userId);

      // Use native Redis client for DEL and SREM
      const del = this.getNativeMethod("del");
      // cspell:disable-next-line -- Redis command
      const sRem = this.getNativeMethod("srem");

      if (del && sRem) {
        await del(this.getSessionKey(sessionId));
        await sRem(userSessionsKey, sessionId);
      }

      logger.debug(`Session ${sessionId} deleted from Redis`);
    } else {
      await this.redis.del(this.getSessionKey(sessionId));
    }
  }

  /**
   * Get all session IDs for a user
   */
  async getUserSessions(userId: string): Promise<string[]> {
    const userSessionsKey = this.getUserSessionsKey(userId);

    // cspell:disable-next-line -- Redis commands
    const sMembers = this.getNativeMethod("smembers");
    if (!sMembers) {
      logger.error("smembers command not available on Redis client");
      return [];
    }

    const result = await sMembers(userSessionsKey);
    return Array.isArray(result) ? result.map(String) : [];
  }

  /**
   * Delete all sessions for a user (logout everywhere)
   */
  async deleteUserSessions(userId: string): Promise<number> {
    const sessionIds = await this.getUserSessions(userId);

    if (sessionIds.length === 0) {
      return 0;
    }

    // Delete all session keys and the user sessions set
    const del = this.getNativeMethod("del");

    if (del) {
      const keysToDelete = [...sessionIds.map(id => this.getSessionKey(id)), this.getUserSessionsKey(userId)];
      await del(...keysToDelete);
    }

    logger.info(`Deleted ${sessionIds.length} sessions for user ${userId}`);

    return sessionIds.length;
  }

  /**
   * Count active sessions for a user
   */
  async countUserSessions(userId: string): Promise<number> {
    const userSessionsKey = this.getUserSessionsKey(userId);

    // Use native Redis client for SCARD
    // cspell:disable-next-line -- Redis command
    const sCard = this.getNativeMethod("scard");

    if (sCard) {
      const count = await sCard(userSessionsKey);
      return Number(count) || 0;
    }

    return 0;
  }

  /**
   * Enforce concurrent session limit by removing oldest sessions
   */
  async enforceConcurrentLimit(userId: string, maxSessions: number): Promise<void> {
    const sessionIds = await this.getUserSessions(userId);

    // Trim to maxSessions - 1 to make room for the session about to be inserted
    const allowedBeforeInsert = maxSessions - 1;
    if (sessionIds.length <= allowedBeforeInsert) {
      return;
    }

    // Get all sessions with their creation times (batched for performance)
    const sessionResults = await Promise.all(sessionIds.map(sessionId => this.getSession(sessionId)));

    const sessionsWithTime: Array<{ id: string; createdAt: Date }> = [];
    for (let i = 0; i < sessionIds.length; i++) {
      const session = sessionResults[i];
      if (session) {
        sessionsWithTime.push({
          id: sessionIds[i],
          createdAt: new Date(session.createdAt),
        });
      }
    }

    // Sort by creation time (oldest first)
    sessionsWithTime.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Delete oldest sessions to bring count down to allowedBeforeInsert
    const sessionsToDelete = sessionsWithTime.length - allowedBeforeInsert;
    const deletePromises = sessionsWithTime.slice(0, sessionsToDelete).map(s => this.deleteSession(s.id));

    await Promise.all(deletePromises);

    logger.info(`Deleted ${sessionsToDelete} old sessions for user ${userId} to enforce limit of ${maxSessions}`);
  }

  /**
   * Get session TTL in seconds
   */
  async getSessionTTL(sessionId: string): Promise<number> {
    const key = this.getSessionKey(sessionId);
    return await this.redis.ttl(key);
  }
}
