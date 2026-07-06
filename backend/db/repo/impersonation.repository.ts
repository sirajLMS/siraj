import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { impersonationSessions } from "@/backend/db/schema/impersonation";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "../db.types";

const IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

function sanitizeIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const parts = ip.split(":");
  const cleanIp = parts.length === 2 ? parts[0] : ip;
  return IPV4_REGEX.test(cleanIp) ? cleanIp : "127.0.0.1";
}

async function runInTransaction<T>(tx: DBTransaction | undefined, fn: (t: DBTransaction) => Promise<T>): Promise<T> {
  return tx ? await fn(tx) : await db.transaction((t: DBTransaction) => fn(t));
}

export namespace ImpersonationRepository {
  export async function createSession(
    input: Types.StartImpersonationInput,
    tx?: DBTransaction
  ): Promise<Types.ImpersonationSessionReturnType> {
    return runInTransaction(tx, async t => {
      const [created] = await t
        .insert(impersonationSessions)
        .values({
          actorUserId: input.actorUserId,
          targetUserId: input.targetUserId,
          sessionId: input.sessionId,
          reason: input.reason ?? null,
          ipAddress: sanitizeIpAddress(input.ipAddress),
          userAgent: input.userAgent ?? null,
          startedAt: new Date(),
          isActive: true,
        })
        .returning();
      return created;
    });
  }

  export async function endActiveForActor(
    actorUserId: string,
    tx?: DBTransaction
  ): Promise<Types.ImpersonationSessionReturnType | null> {
    return runInTransaction(tx, async t => {
      const [ended] = await t
        .update(impersonationSessions)
        .set({ isActive: false, endedAt: new Date() })
        .where(and(eq(impersonationSessions.actorUserId, actorUserId), eq(impersonationSessions.isActive, true)))
        .returning();
      return ended ?? null;
    });
  }

  export async function endById(
    id: string,
    tx?: DBTransaction
  ): Promise<Types.ImpersonationSessionReturnType | null> {
    return runInTransaction(tx, async t => {
      const [ended] = await t
        .update(impersonationSessions)
        .set({ isActive: false, endedAt: new Date() })
        .where(and(eq(impersonationSessions.id, id), eq(impersonationSessions.isActive, true)))
        .returning();
      return ended ?? null;
    });
  }

  export async function findActiveByActor(
    actorUserId: string,
    tx?: DBTransaction
  ): Promise<Types.ImpersonationSessionReturnType | null> {
    const runner = tx || db;
    const [row] = await runner
      .select()
      .from(impersonationSessions)
      .where(and(eq(impersonationSessions.actorUserId, actorUserId), eq(impersonationSessions.isActive, true)))
      .limit(1);
    return row ?? null;
  }

  export async function findActiveBySessionId(
    sessionId: string,
    tx?: DBTransaction
  ): Promise<Types.ImpersonationSessionReturnType | null> {
    const runner = tx || db;
    const [row] = await runner
      .select()
      .from(impersonationSessions)
      .where(and(eq(impersonationSessions.sessionId, sessionId), eq(impersonationSessions.isActive, true)))
      .limit(1);
    return row ?? null;
  }
}
