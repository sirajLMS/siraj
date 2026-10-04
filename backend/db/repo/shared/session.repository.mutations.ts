import { eq } from "drizzle-orm";
import { db } from "@/backend/db";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared/advisory-lock";
import { DEFAULT_SESSION_TTL } from "@/backend/db/repo/shared/session.repository.constants";
import { findSessionRecordById, getSessionConfigByRole } from "@/backend/db/repo/shared/session.repository.queries";
import { getSessionRedisService, redisSessionsEnabled } from "@/backend/db/repo/shared/session.repository.redis";
import { sessionMetadata, sessions } from "@/backend/db/schema";
import { hashSessionId } from "@/backend/lib/auth/session-hash";
import { sanitizeIpAddress } from "@/backend/lib/ip-utils";
import { logger } from "@/backend/lib/logger";
import type { DBTransaction, SessionInsertType, SessionSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

interface SessionCreationOptions extends Omit<SessionInsertType, "lastActivity"> {
  deviceType?: string;
  deviceName?: string;
  roleName?: string;
}

/**
 * Acquire advisory lock for a user
 */
async function acquireUserLock(tx: DBTransaction, userId: string): Promise<void> {
  await acquireAdvisoryLock(tx, `session_user_${userId}`);
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
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null,
    payload,
    lastActivity: BigInt(Math.floor(now.getTime() / 1000)),
  };
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
      userAgent: input.userAgent ?? null,
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
export const createSession = async (
  input: SessionCreationOptions,
  tx?: DBTransaction,
  locale?: string
): Promise<SessionSelectType> => {
  const runner = async (t: DBTransaction) => {
    if (!input.userId) {
      const { session } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(session.userIdRequired);
    }

    const hashedId = hashSessionId(input.hashedId);

    if (!redisSessionsEnabled()) return await createPostgresSession(t, { ...input, hashedId });

    await acquireUserLock(t, input.userId);
    const config = await getSessionConfigByRole(input.roleName ?? "default", t);

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
        userAgent: input.userAgent ?? undefined,
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
      deviceType: input.deviceType ?? null,
      deviceName: input.deviceName ?? null,
      ipAddress: sanitizeIpAddress(input.ipAddress),
      userAgent: input.userAgent ?? null,
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
export const updateSession = async (
  input: Omit<SessionInsertType, "lastActivity"> & { roleName?: string },
  tx?: DBTransaction,
  locale?: string
): Promise<SessionSelectType> => {
  const runner = async (t: DBTransaction) => {
    if (!input.userId) {
      const { session } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(session.userIdRequired);
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

    const config = await getSessionConfigByRole(input.roleName ?? "default", t);
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

export const deleteSessionRecordById = async (
  rawSessionId: string,
  tx?: DBTransaction
): Promise<SessionSelectType | null> => {
  const hashedId = hashSessionId(rawSessionId);
  const runner = async (t: DBTransaction) => {
    const existingSession = await findSessionRecordById(rawSessionId);
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

export const deleteSessionsByUserId = async (userId: string, tx?: DBTransaction): Promise<number> => {
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
 * Re-hash a session's stored identifier from a legacy SHA-256 hash to the current HMAC hash.
 * This is a primitive data-access method — the service layer decides when to call it.
 */
export const rehashSessionRecord = async (
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
