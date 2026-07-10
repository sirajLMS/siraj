import { and, eq, type SQL } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { impersonationSessions } from "@/backend/db/schema/auth/impersonation";
import type * as Types from "@/backend/types";

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

function activeSessionFilter(sessionCondition: SQL): SQL {
  return and(sessionCondition, eq(impersonationSessions.isActive, true)) as SQL;
}

async function updateToInactive(
  sessionCondition: SQL,
  runner: DBTransaction
): Promise<Types.ImpersonationSessionReturnType | null> {
  const [ended] = await runner
    .update(impersonationSessions)
    .set({ isActive: false, endedAt: new Date() })
    .where(activeSessionFilter(sessionCondition))
    .returning();
  return ended ?? null;
}

async function findActive(
  sessionCondition: SQL,
  runner: DBTransaction | typeof db
): Promise<Types.ImpersonationSessionReturnType | null> {
  const [row] = await runner.select().from(impersonationSessions).where(activeSessionFilter(sessionCondition)).limit(1);
  return row ?? null;
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
    return runInTransaction(tx, async t => updateToInactive(eq(impersonationSessions.actorUserId, actorUserId), t));
  }

  export async function endById(id: string, tx?: DBTransaction): Promise<Types.ImpersonationSessionReturnType | null> {
    return runInTransaction(tx, async t => updateToInactive(eq(impersonationSessions.id, id), t));
  }

  export async function findActiveByActor(
    actorUserId: string,
    tx?: DBTransaction
  ): Promise<Types.ImpersonationSessionReturnType | null> {
    return findActive(eq(impersonationSessions.actorUserId, actorUserId), tx || db);
  }

  export async function findActiveBySessionId(
    sessionId: string,
    tx?: DBTransaction
  ): Promise<Types.ImpersonationSessionReturnType | null> {
    return findActive(eq(impersonationSessions.sessionId, sessionId), tx || db);
  }
}
