import { and, desc, eq, lte, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { sessionConfig, sessionMetadata, sessions } from "@/backend/db/schema";
import { hashSessionId } from "@/backend/lib/auth/session-hash";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { getRedisService, SessionRedisService } from "@/backend/services";
import type {
  RedisGroupSimulationSessionData,
  RedisSessionData,
  SessionConfigSelectType,
  SessionInsertType,
  SessionMetadataSelectType,
  SessionSelectType,
} from "@/backend/types/auth/auth.types";

// Default session configuration
const DEFAULT_SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const DEFAULT_MAX_CONCURRENT_SESSIONS = 5;

// Lazy-load Redis session service
let sessionRedisService: SessionRedisService | null = null;

/**
 * Whether sessions should use Redis.
 */
function redisSessionsEnabled(): boolean {
  return getEnvironmentConfig().cacheProvider !== "postgres";
}

async function getSessionRedisService(): Promise<SessionRedisService> {
  sessionRedisService ??= new SessionRedisService(await getRedisService());
  return sessionRedisService;
}

const IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

function sanitizeIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const parts = ip.split(":");
  const cleanIp = parts.length === 2 ? parts[0] : ip;
  return IPV4_REGEX.test(cleanIp) ? cleanIp : "127.0.0.1";
}

export namespace SessionRepository {
  /**
   * Acquire advisory lock for a user
   */
  async function acquireUserLock(tx: DBTransaction, userId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('session_user_' || ${userId}::text))`);
  }

  /**
   * Map a Redis session to a SessionSelectType return shape.
   */
  function mapRedisSession(redisSession: RedisSessionData): SessionSelectType {
    return {
      hashedId: redisSession.hashedId,
      userId: redisSession.userId,
      ipAddress: redisSession.ipAddress || null,
      userAgent: redisSession.userAgent || null,
      payload: redisSession.payload,
      lastActivity: BigInt(Math.floor(new Date(redisSession.lastActivityAt).getTime() / 1000)),
    };
  }

  /**
   * Build a SessionSelectType return shape from input fields and a timestamp.
   */
  function buildInlineSession(
    hashedId: string,
    userId: string,
    ipAddress: string | null | undefined,
    userAgent: string | null | undefined,
    payload: string,
    now: Date
  ): SessionSelectType {
    return {
      hashedId,
      userId,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      payload,
      lastActivity: BigInt(Math.floor(now.getTime() / 1000)),
    };
  }

  /**
   * Get session configuration for a role
   */
  export const getSessionConfig = async (
    roleName: string = "default",
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType> => {
    const runner = tx || db;
    const configs = await runner.select().from(sessionConfig).where(eq(sessionConfig.roleName, roleName)).limit(1);

    if (configs.length > 0) return configs[0];

    return {
      id: "default",
      roleName: "default",
      ttlSeconds: DEFAULT_SESSION_TTL,
      maxConcurrentSessions: DEFAULT_MAX_CONCURRENT_SESSIONS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  /**
   * Create or update session configuration
   */
  export const upsertSessionConfig = async (
    input: Omit<SessionConfigSelectType, "id" | "createdAt" | "updatedAt">,
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType> => {
    const runner = async (t: DBTransaction) => {
      const existing = await t.select().from(sessionConfig).where(eq(sessionConfig.roleName, input.roleName)).limit(1);

      if (existing.length > 0) {
        const [updated] = await t
          .update(sessionConfig)
          .set({
            ttlSeconds: input.ttlSeconds,
            maxConcurrentSessions: input.maxConcurrentSessions,
            updatedAt: new Date(),
          })
          .where(eq(sessionConfig.roleName, input.roleName))
          .returning();
        return updated;
      }

      const [created] = await t
        .insert(sessionConfig)
        .values({ ...input, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      return created;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const findSessionById = async (rawSessionId: string): Promise<SessionSelectType | null> => {
    const hashedId = hashSessionId(rawSessionId);
    try {
      if (redisSessionsEnabled()) {
        const redisService = await getSessionRedisService();
        const redisSession = await redisService.getSession(hashedId);
        if (redisSession) return mapRedisSession(redisSession);
      }

      return await db
        .select()
        .from(sessions)
        .where(eq(sessions.hashedId, hashedId))
        .then(res => res[0] ?? null);
    } catch (error) {
      logger.error("Error finding session:", error);
      return null;
    }
  };

  export const findSessionsByUserId = async (userId: string): Promise<RedisSessionData[]> => {
    try {
      if (!redisSessionsEnabled()) return [];

      const redisService = await getSessionRedisService();
      const sessionIds = await redisService.getUserSessions(userId);
      const sessionPromises = sessionIds.map(id => redisService.getSession(id));
      const found = await Promise.all(sessionPromises);

      return found.filter((s: RedisSessionData | null): s is RedisSessionData => s !== null);
    } catch (error) {
      logger.error("Error finding sessions by user ID:", error);
      return [];
    }
  };

  export const findByUserId = async (userId: string): Promise<SessionSelectType | null> => {
    // When Redis is not enabled, sessions live in Postgres — query directly
    if (!redisSessionsEnabled()) {
      const pgSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.lastActivity))
        .limit(1);
      return pgSessions[0] ?? null;
    }

    const sessionsList = await findSessionsByUserId(userId);
    if (sessionsList.length === 0) return null;

    const sortedSessions = sessionsList.toSorted(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    );
    const mostRecent = sortedSessions[0];

    return {
      hashedId: mostRecent.hashedId,
      userId: mostRecent.userId,
      ipAddress: mostRecent.ipAddress || null,
      userAgent: mostRecent.userAgent || null,
      payload: mostRecent.payload,
      lastActivity: BigInt(Math.floor(new Date(mostRecent.lastActivityAt).getTime() / 1000)),
    };
  };

  export interface SessionCreationOptions extends Omit<SessionInsertType, "lastActivity"> {
    deviceType?: string;
    deviceName?: string;
    roleName?: string;
  }

  /**
   * Internal helper to create session in PostgreSQL only
   */
  async function createPostgresSession(
    t: DBTransaction | typeof db,
    input: SessionCreationOptions
  ): Promise<SessionSelectType> {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const [created] = await t
      .insert(sessions)
      .values({
        hashedId: input.hashedId,
        userId: input.userId,
        ipAddress: sanitizeIpAddress(input.ipAddress),
        userAgent: input.userAgent || null,
        payload: input.payload,
        lastActivity: now,
      })
      .returning();
    return created;
  }

  /**
   * Create a new session.
   * The input.hashedId field should contain the raw (plaintext) session ID —
   * it will be hashed before storage so that a database compromise does not
   * leak usable session identifiers.
   */
  export const create = async (
    input: SessionCreationOptions,
    tx?: DBTransaction,
    _locale?: string
  ): Promise<SessionSelectType> => {
    const runner = async (t: DBTransaction) => {
      if (!input.userId) {
        throw new Error("User ID (userId) is required to create a session");
      }

      const hashedId = hashSessionId(input.hashedId);

      if (!redisSessionsEnabled()) return await createPostgresSession(t, { ...input, hashedId });

      await acquireUserLock(t, input.userId);
      const config = await getSessionConfig(input.roleName || "default", t);

      const redisService = await getSessionRedisService();
      await redisService.enforceConcurrentLimit(input.userId, config.maxConcurrentSessions);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + config.ttlSeconds * 1000);

      await redisService.setSession({
        sessionId: hashedId,
        data: {
          userId: input.userId,
          hashedId,
          payload: input.payload,
          ipAddress: sanitizeIpAddress(input.ipAddress) ?? undefined,
          userAgent: input.userAgent || undefined,
          deviceType: input.deviceType,
          deviceName: input.deviceName,
          createdAt: now.toISOString(),
          lastActivityAt: now.toISOString(),
        },
        ttlSeconds: config.ttlSeconds,
      });

      await t.insert(sessionMetadata).values({
        sessionId: hashedId,
        userId: input.userId,
        deviceType: input.deviceType || null,
        deviceName: input.deviceName || null,
        ipAddress: sanitizeIpAddress(input.ipAddress),
        userAgent: input.userAgent || null,
        createdAt: now,
        lastActivityAt: now,
        expiresAt,
      });

      logger.info(`Created session ${hashedId} for user ${input.userId}`);
      return buildInlineSession(hashedId, input.userId, input.ipAddress, input.userAgent, input.payload, now);
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  /**
   * Update session.
   * The input.hashedId field should contain the raw (plaintext) session ID —
   * it will be hashed before lookup.
   */
  export const update = async (
    input: Omit<SessionInsertType, "lastActivity"> & { roleName?: string },
    tx?: DBTransaction,
    _locale?: string
  ): Promise<SessionSelectType> => {
    const runner = async (t: DBTransaction) => {
      if (!input.userId) {
        throw new Error("User ID (userId) is required to update a session");
      }

      const hashedId = hashSessionId(input.hashedId);
      const now = new Date();

      if (!redisSessionsEnabled()) {
        const postgresUpdates: {
          lastActivity: bigint;
          payload?: string;
        } = {
          lastActivity: BigInt(Math.floor(now.getTime() / 1000)),
        };
        postgresUpdates.payload = input.payload;
        const returning = await t
          .update(sessions)
          .set(postgresUpdates)
          .where(eq(sessions.hashedId, hashedId))
          .returning();
        if (returning.length === 0) {
          throw new Error(`Session ${hashedId} not found`);
        }
        return returning[0];
      }

      const config = await getSessionConfig(input.roleName || "default", t);
      const redisService = await getSessionRedisService();
      const success = await redisService.touchSession(hashedId, config.ttlSeconds);

      if (!success) {
        throw new Error(`Session ${hashedId} not found`);
      }

      const expiresAt = new Date(now.getTime() + config.ttlSeconds * 1000);
      await t
        .update(sessionMetadata)
        .set({ lastActivityAt: now, expiresAt })
        .where(eq(sessionMetadata.sessionId, hashedId));

      logger.debug(`Updated session ${hashedId}`);
      return buildInlineSession(hashedId, input.userId, input.ipAddress, input.userAgent, input.payload, now);
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const deleteSessionById = async (
    rawSessionId: string,
    tx?: DBTransaction
  ): Promise<SessionSelectType | null> => {
    const hashedId = hashSessionId(rawSessionId);
    const runner = async (t: DBTransaction) => {
      const existingSession = await findSessionById(rawSessionId);
      if (existingSession) {
        if (redisSessionsEnabled()) {
          const redisService = await getSessionRedisService();
          await redisService.deleteSession(hashedId);
          await t.delete(sessionMetadata).where(eq(sessionMetadata.sessionId, hashedId));
        } else {
          await t.delete(sessions).where(eq(sessions.hashedId, hashedId));
        }

        logger.info(`Deleted session ${hashedId}`);
        return existingSession;
      }
      return null;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  export const deleteByUserId = async (userId: string, tx?: DBTransaction): Promise<number> => {
    const runner = async (t: DBTransaction) => {
      if (!redisSessionsEnabled()) {
        const deleted = await t.delete(sessions).where(eq(sessions.userId, userId)).returning();
        return deleted.length;
      }

      await acquireUserLock(t, userId);
      const redisService = await getSessionRedisService();
      const deletedCount = await redisService.deleteUserSessions(userId);

      await t.delete(sessionMetadata).where(eq(sessionMetadata.userId, userId));

      logger.info(`Deleted all sessions for user ${userId} (count: ${deletedCount})`);
      return deletedCount;
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  /**
   * Validate session.
   * The sessionId parameter is the raw (plaintext) session ID from the cookie —
   * it will be hashed before looking up the stored record.
   */
  export const validate = async (
    rawSessionId: string,
    roleName: string = "default"
  ): Promise<SessionSelectType | null> => {
    const hashedId = hashSessionId(rawSessionId);
    if (!redisSessionsEnabled()) {
      const session = await findSessionById(rawSessionId);
      if (!session) return null;

      const config = await getSessionConfig(roleName);
      const now = BigInt(Math.floor(Date.now() / 1000));
      const isExpired = Number(now - session.lastActivity) > config.ttlSeconds;

      if (isExpired) {
        await db.delete(sessions).where(eq(sessions.hashedId, hashedId));
        return null;
      }

      await db.update(sessions).set({ lastActivity: now }).where(eq(sessions.hashedId, hashedId));
      return { ...session, lastActivity: now };
    }

    const redisService = await getSessionRedisService();
    const session = await redisService.getSession(hashedId);
    if (!session) return null;

    const config = await getSessionConfig(roleName);
    await redisService.touchSession(hashedId, config.ttlSeconds);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.ttlSeconds * 1000);

    await db
      .update(sessionMetadata)
      .set({ lastActivityAt: now, expiresAt })
      .where(eq(sessionMetadata.sessionId, hashedId));

    return mapRedisSession(session);
  };

  /**
   * Look up a session by its pre-computed HMAC hash.
   * This is a primitive data-access method — callers compute the hash.
   */
  export const findByHmacHash = async (hmacHash: string): Promise<SessionSelectType | null> => {
    try {
      if (redisSessionsEnabled()) {
        const redisService = await getSessionRedisService();
        const redisSession = await redisService.getSession(hmacHash);
        if (redisSession) return mapRedisSession(redisSession);
      }

      return await db
        .select()
        .from(sessions)
        .where(eq(sessions.hashedId, hmacHash))
        .then(res => res[0] ?? null);
    } catch (error) {
      logger.error("Error finding session by HMAC hash:", error);
      return null;
    }
  };

  /**
   * Look up a session by its pre-computed legacy SHA-256 hash.
   * This is a primitive data-access method — callers compute the hash.
   */
  export const findByLegacyHash = async (legacyHash: string): Promise<SessionSelectType | null> => {
    try {
      // Legacy sessions predate Redis migration — always check PostgreSQL.
      // Redis keys use the HMAC hash, so a legacy-hash key will never exist in Redis.
      return await db
        .select()
        .from(sessions)
        .where(eq(sessions.hashedId, legacyHash))
        .then(res => res[0] ?? null);
    } catch (error) {
      logger.error("Error finding session by legacy hash:", error);
      return null;
    }
  };

  /**
   * Re-hash a session's stored identifier from a legacy SHA-256 hash to the current HMAC hash.
   * This is a primitive data-access method — the service layer decides when to call it.
   */
  export const rehashSession = async (
    legacyHash: string,
    hmacHash: string,
    userId: string,
    tx?: DBTransaction
  ): Promise<void> => {
    const runner = async (t: DBTransaction) => {
      await t.update(sessions).set({ hashedId: hmacHash }).where(eq(sessions.hashedId, legacyHash));

      if (redisSessionsEnabled()) {
        const redisService = await getSessionRedisService();
        // Migrate Redis session to new HMAC key
        const redisSession = await redisService.getSession(legacyHash);
        if (redisSession) {
          await redisService.setSession({
            sessionId: hmacHash,
            data: { ...redisSession, hashedId: hmacHash },
            ttlSeconds: DEFAULT_SESSION_TTL,
          });
          await redisService.deleteSession(legacyHash);
        }
      }

      logger.info("Session hash migrated from legacy SHA-256 to HMAC", { userId });
    };

    if (tx) {
      await runner(tx);
    } else {
      await db.transaction((t: DBTransaction) => runner(t));
    }
  };

  export const cleanupExpiredSessions = async (): Promise<number> => {
    const result = await db.delete(sessionMetadata).where(lte(sessionMetadata.expiresAt, new Date())).returning();
    logger.info(`Cleaned up ${result.length} expired session metadata records`);
    return result.length;
  };

  export const getUserSessionMetadata = async (
    userId: string,
    tx?: DBTransaction
  ): Promise<SessionMetadataSelectType[]> => {
    const runner = tx || db;
    return await runner
      .select()
      .from(sessionMetadata)
      .where(and(eq(sessionMetadata.userId, userId), sql`${sessionMetadata.expiresAt} > NOW()`))
      .orderBy(sql`${sessionMetadata.lastActivityAt} DESC`);
  };

  export const countUserSessions = async (userId: string): Promise<number> => {
    const redisService = await getSessionRedisService();
    return await redisService.countUserSessions(userId);
  };

  export const getSessionTTL = async (rawSessionId: string): Promise<number> => {
    const hashedId = hashSessionId(rawSessionId);
    const redisService = await getSessionRedisService();
    return await redisService.getSessionTTL(hashedId);
  };

  /**
   * Read full Redis session data (including impersonation state).
   */
  export const getRedisSessionData = async (rawSessionId: string): Promise<RedisSessionData | null> => {
    if (!redisSessionsEnabled()) return null;
    const hashedId = hashSessionId(rawSessionId);
    const redisService = await getSessionRedisService();
    return await redisService.getSession(hashedId);
  };

  /**
   * Patch Redis session data in place (preserves TTL).
   */
  export const updateRedisSessionData = async (
    rawSessionId: string,
    updater: (data: RedisSessionData) => RedisSessionData,
    roleName: string = "default"
  ): Promise<RedisSessionData | null> => {
    if (!redisSessionsEnabled()) return null;

    const hashedId = hashSessionId(rawSessionId);
    const redisService = await getSessionRedisService();
    const existing = await redisService.getSession(hashedId);
    if (!existing) return null;

    const updated = updater(existing);
    const config = await getSessionConfig(roleName);
    const ttl = await redisService.getSessionTTL(hashedId);
    const ttlSeconds = ttl > 0 ? ttl : config.ttlSeconds;

    await redisService.setSession({
      sessionId: hashedId,
      data: updated,
      ttlSeconds,
    });

    return updated;
  };

  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  function parseSessionPayload(payload: string | null | undefined): Record<string, unknown> {
    if (!payload) return {};
    try {
      const parsed: unknown = JSON.parse(payload);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function readGroupSimulationFromPayload(payload: string | null | undefined): RedisGroupSimulationSessionData | null {
    const groupSimulation = parseSessionPayload(payload).groupSimulation;
    if (!isRecord(groupSimulation)) {
      return null;
    }
    if (
      typeof groupSimulation.groupSlug !== "string" ||
      typeof groupSimulation.startedAt !== "string" ||
      typeof groupSimulation.expiresAt !== "string"
    ) {
      return null;
    }
    return {
      groupSlug: groupSimulation.groupSlug,
      startedAt: groupSimulation.startedAt,
      expiresAt: groupSimulation.expiresAt,
    };
  }

  export async function getSessionGroupSimulation(
    rawSessionId: string,
    actorUserId: string
  ): Promise<{ data: RedisGroupSimulationSessionData; expiresAt: Date } | null> {
    if (redisSessionsEnabled()) {
      const sessionData = await getRedisSessionData(rawSessionId);
      if (!sessionData?.groupSimulation || sessionData.userId !== actorUserId) {
        return null;
      }
      const expiresAt = new Date(sessionData.groupSimulation.expiresAt);
      if (expiresAt.getTime() <= Date.now()) {
        return null;
      }
      return { data: sessionData.groupSimulation, expiresAt };
    }

    const session = await findSessionById(rawSessionId);
    if (!session?.userId || session.userId !== actorUserId) {
      return null;
    }

    const data = readGroupSimulationFromPayload(session.payload);
    if (!data) {
      return null;
    }

    const expiresAt = new Date(data.expiresAt);
    if (expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return { data, expiresAt };
  }

  export async function setSessionGroupSimulation(
    rawSessionId: string,
    groupSimulation: RedisGroupSimulationSessionData
  ): Promise<void> {
    if (redisSessionsEnabled()) {
      await updateRedisSessionData(rawSessionId, data => ({
        ...data,
        groupSimulation,
        impersonation: undefined,
      }));
      return;
    }

    const session = await findSessionById(rawSessionId);
    if (!session?.userId) {
      return;
    }

    const parsedPayload = parseSessionPayload(session.payload);
    delete parsedPayload.impersonation;
    const nextPayload = {
      ...parsedPayload,
      groupSimulation,
    };

    await update({
      hashedId: rawSessionId,
      userId: session.userId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      payload: JSON.stringify(nextPayload),
    });
  }

  export async function clearSessionGroupSimulation(rawSessionId: string): Promise<void> {
    if (redisSessionsEnabled()) {
      await updateRedisSessionData(rawSessionId, data => {
        const rest: RedisSessionData = { ...data };
        delete rest.groupSimulation;
        return rest;
      });
      return;
    }

    const session = await findSessionById(rawSessionId);
    if (!session?.userId) {
      return;
    }

    const nextPayload = parseSessionPayload(session.payload);
    delete nextPayload.groupSimulation;

    await update({
      hashedId: rawSessionId,
      userId: session.userId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      payload: JSON.stringify(nextPayload),
    });
  }
}
