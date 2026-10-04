import { desc, eq } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  DEFAULT_MAX_CONCURRENT_SESSIONS,
  DEFAULT_SESSION_TTL,
} from "@/backend/db/repo/shared/session.repository.constants";
import { getSessionRedisService, redisSessionsEnabled } from "@/backend/db/repo/shared/session.repository.redis";
import { sessionConfig, sessions } from "@/backend/db/schema";
import { hashSessionId } from "@/backend/lib/auth/session-hash";
import { logger } from "@/backend/lib/logger";
import type {
  DBQueryExecutor,
  DBTransaction,
  RedisSessionData,
  SessionConfigSelectType,
  SessionSelectType,
} from "@/backend/types";

/**
 * Map a Redis session to a SessionSelectType return shape.
 */
export function mapRedisSession(redisSession: RedisSessionData): SessionSelectType {
  return {
    hashedId: redisSession.hashedId,
    userId: redisSession.userId,
    ipAddress: redisSession.ipAddress ?? null,
    userAgent: redisSession.userAgent ?? null,
    payload: redisSession.payload,
    lastActivity: BigInt(Math.floor(new Date(redisSession.lastActivityAt).getTime() / 1000)),
  };
}

/**
 * Get session configuration for a role
 */
export const getSessionConfigByRole = async (
  roleName: string = "default",
  tx?: DBTransaction
): Promise<SessionConfigSelectType> => {
  const runner = tx ?? db;
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
export const upsertSessionConfigRecord = async (
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

/**
 * Select a session row from PostgreSQL by its stored hash, returning null when absent.
 */
const selectSessionRowByHash = async (hashedId: string, runner: DBQueryExecutor): Promise<SessionSelectType | null> =>
  runner
    .select()
    .from(sessions)
    .where(eq(sessions.hashedId, hashedId))
    .then(res => res[0] ?? null);

/**
 * Resolve a session by its stored hash: check Redis first when enabled, otherwise read PostgreSQL.
 */
const fetchSessionByHash = async (hashedId: string, runner: DBQueryExecutor): Promise<SessionSelectType | null> => {
  if (redisSessionsEnabled()) {
    const redisService = await getSessionRedisService();
    const redisSession = await redisService.getSession(hashedId);
    if (redisSession) return mapRedisSession(redisSession);
  }
  return selectSessionRowByHash(hashedId, runner);
};

export const findSessionRecordById = async (
  rawSessionId: string,
  tx?: DBTransaction
): Promise<SessionSelectType | null> => {
  try {
    const hashedId = hashSessionId(rawSessionId);
    return await fetchSessionByHash(hashedId, tx ?? db);
  } catch (error) {
    logger.error("Error finding session:", error);
    return null;
  }
};

const findSessionsByUserId = async (userId: string): Promise<RedisSessionData[]> => {
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

export const findLatestSessionByUserId = async (userId: string): Promise<SessionSelectType | null> => {
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

  return mapRedisSession(sortedSessions[0]);
};

/**
 * Look up a session by its pre-computed HMAC hash.
 * This is a primitive data-access method — callers compute the hash.
 */
export const findSessionByHmacHash = async (hmacHash: string): Promise<SessionSelectType | null> => {
  try {
    return await fetchSessionByHash(hmacHash, db);
  } catch (error) {
    logger.error("Error finding session by HMAC hash:", error);
    return null;
  }
};

/**
 * Look up a session by its pre-computed legacy SHA-256 hash.
 * This is a primitive data-access method — callers compute the hash.
 */
export const findSessionByLegacyHash = async (legacyHash: string): Promise<SessionSelectType | null> => {
  try {
    // Legacy sessions predate Redis migration — always check PostgreSQL.
    // Redis keys use the HMAC hash, so a legacy-hash key will never exist in Redis.
    return await selectSessionRowByHash(legacyHash, db);
  } catch (error) {
    logger.error("Error finding session by legacy hash:", error);
    return null;
  }
};
