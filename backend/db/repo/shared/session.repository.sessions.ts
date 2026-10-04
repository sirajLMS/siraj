import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/backend/db";
import { updateSession } from "@/backend/db/repo/shared/session.repository.mutations";
import {
  findSessionRecordById,
  getSessionConfigByRole,
  mapRedisSession,
} from "@/backend/db/repo/shared/session.repository.queries";
import { getSessionRedisService, redisSessionsEnabled } from "@/backend/db/repo/shared/session.repository.redis";
import { sessionMetadata, sessions } from "@/backend/db/schema";
import { hashSessionId } from "@/backend/lib/auth/session-hash";
import type {
  DBTransaction,
  RedisGroupSimulationSessionData,
  RedisSessionData,
  SessionMetadataSelectType,
  SessionSelectType,
} from "@/backend/types";

/**
 * Validate session.
 * The sessionId parameter is the raw (plaintext) session ID from the cookie —
 * it will be hashed before looking up the stored record.
 */
export const validateSession = async (
  rawSessionId: string,
  roleName: string = "default",
  tx?: DBTransaction
): Promise<SessionSelectType | null> => {
  const runner = tx ?? db;
  const hashedId = hashSessionId(rawSessionId);
  if (!redisSessionsEnabled()) {
    const session = await findSessionRecordById(rawSessionId, tx);
    if (!session) return null;

    const config = await getSessionConfigByRole(roleName, tx);
    const now = BigInt(Math.floor(Date.now() / 1000));
    const isExpired = Number(now - BigInt(session.lastActivity)) > config.ttlSeconds;

    if (isExpired) {
      await runner.delete(sessions).where(eq(sessions.hashedId, hashedId));
      return null;
    }

    await runner.update(sessions).set({ lastActivity: now }).where(eq(sessions.hashedId, hashedId));
    return { ...session, lastActivity: now };
  }

  const redisService = await getSessionRedisService();
  const session = await redisService.getSession(hashedId);
  if (!session) return null;

  const config = await getSessionConfigByRole(roleName, tx);
  await redisService.touchSession(hashedId, config.ttlSeconds);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.ttlSeconds * 1000);

  await runner
    .update(sessionMetadata)
    .set({ lastActivityAt: now, expiresAt })
    .where(eq(sessionMetadata.sessionId, hashedId));

  return mapRedisSession(session);
};

export const fetchUserSessionMetadata = async (
  userId: string,
  tx?: DBTransaction
): Promise<SessionMetadataSelectType[]> => {
  const runner = tx ?? db;
  return await runner
    .select()
    .from(sessionMetadata)
    .where(and(eq(sessionMetadata.userId, userId), gt(sessionMetadata.expiresAt, new Date())))
    .orderBy(desc(sessionMetadata.lastActivityAt));
};

export const countActiveUserSessions = async (userId: string): Promise<number> => {
  const redisService = await getSessionRedisService();
  return await redisService.countUserSessions(userId);
};

export const fetchSessionTTL = async (rawSessionId: string): Promise<number> => {
  const hashedId = hashSessionId(rawSessionId);
  const redisService = await getSessionRedisService();
  return await redisService.getSessionTTL(hashedId);
};

/**
 * Read full Redis session data (including impersonation state).
 */
const getRedisSessionData = async (rawSessionId: string): Promise<RedisSessionData | null> => {
  if (!redisSessionsEnabled()) return null;
  const hashedId = hashSessionId(rawSessionId);
  const redisService = await getSessionRedisService();
  return await redisService.getSession(hashedId);
};

/**
 * Patch Redis session data in place (preserves TTL).
 */
export const patchRedisSessionData = async (
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
  const config = await getSessionConfigByRole(roleName);
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

export async function readSessionGroupSimulation(
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

  const session = await findSessionRecordById(rawSessionId);
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

export async function writeSessionGroupSimulation(
  rawSessionId: string,
  groupSimulation: RedisGroupSimulationSessionData
): Promise<void> {
  if (redisSessionsEnabled()) {
    await patchRedisSessionData(rawSessionId, data => ({
      ...data,
      groupSimulation,
      impersonation: undefined,
    }));
    return;
  }

  const session = await findSessionRecordById(rawSessionId);
  if (!session?.userId) {
    return;
  }

  const parsedPayload = parseSessionPayload(session.payload);
  delete parsedPayload.impersonation;
  const nextPayload = {
    ...parsedPayload,
    groupSimulation,
  };

  await updateSession({
    hashedId: rawSessionId,
    userId: session.userId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    payload: JSON.stringify(nextPayload),
  });
}

export async function removeSessionGroupSimulation(rawSessionId: string): Promise<void> {
  if (redisSessionsEnabled()) {
    await patchRedisSessionData(rawSessionId, data => {
      const rest: RedisSessionData = { ...data };
      delete rest.groupSimulation;
      return rest;
    });
    return;
  }

  const session = await findSessionRecordById(rawSessionId);
  if (!session?.userId) {
    return;
  }

  const nextPayload = parseSessionPayload(session.payload);
  delete nextPayload.groupSimulation;

  await updateSession({
    hashedId: rawSessionId,
    userId: session.userId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    payload: JSON.stringify(nextPayload),
  });
}
