import { eq, lte } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { sessions } from "@/backend/db/schema";
import type { SessionEntity, SessionEntityInput } from "@/backend/types";

const SESSION_TIMEOUT = 7 * 24 * 60 * 60; // 7 days in seconds

export namespace SessionRepository {
  export const findSessionById = async (hashedId: string): Promise<SessionEntity | null> => {
    try {
      return await db
        .select()
        .from(sessions)
        .where(eq(sessions.hashedId, hashedId))
        .then(res => {
          return res[0] ?? null;
        });
    } catch {
      return null;
    }
  };

  export const findByUserId = async (userId: string): Promise<SessionEntity | null> => {
    try {
      return await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .then(res => {
          return res[0] ?? null;
        });
    } catch {
      return null;
    }
  };

  export const findAllSessions = async (): Promise<SessionEntity[]> => {
    return await db.select().from(sessions);
  };

  export const create = async (input: SessionEntityInput): Promise<SessionEntity> => {
    const [createdSession] = await db.insert(sessions).values(input).returning();

    return createdSession;
  };

  export const update = async (input: SessionEntityInput): Promise<SessionEntity> => {
    const [updatedSession] = await db
      .update(sessions)
      .set(input)
      .where(eq(sessions.hashedId, input.hashedId))
      .returning();

    return updatedSession;
  };

  export const deleteSessionById = async (hashedId: string): Promise<SessionEntity | null> => {
    const existingSession = await findSessionById(hashedId);

    // Delete the session
    await db.delete(sessions).where(eq(sessions.hashedId, hashedId));

    // Return the session data as a simple object
    return existingSession;
  };

  export const deleteByUserId = async (userId: string): Promise<void> => {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  };

  export const validate = async (sessionId: string): Promise<SessionEntity | null> => {
    const session = await findSessionById(sessionId);

    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = BigInt(Math.floor(Date.now() / 1000));
    const isExpired = Number(now - session.lastActivity) > SESSION_TIMEOUT;

    if (isExpired) {
      // Delete expired session
      await deleteSessionById(sessionId);
      return null;
    }

    // Update last activity
    await db.update(sessions).set({ lastActivity: now }).where(eq(sessions.hashedId, sessionId));

    return session;
  };

  export const cleanupExpiredSessions = async (): Promise<void> => {
    const cutoffTime = BigInt(Math.floor(Date.now() / 1000) - SESSION_TIMEOUT);
    await db.delete(sessions).where(lte(sessions.lastActivity, cutoffTime));
  };
}
