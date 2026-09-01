import { eq } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { sessionConfig } from "@/backend/db/schema";
import type {
  DBQueryExecutor,
  DBTransaction,
  SessionConfigSelectType,
  SessionConfigUpsertInput,
} from "@/backend/types";

async function upsertOne(
  input: SessionConfigUpsertInput,
  dbToQuery: DBQueryExecutor
): Promise<SessionConfigSelectType> {
  const now = new Date();
  const [row] = await dbToQuery
    .insert(sessionConfig)
    .values({
      roleName: input.roleName,
      ttlSeconds: input.ttlSeconds,
      maxConcurrentSessions: input.maxConcurrentSessions,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: sessionConfig.roleName,
      set: {
        ttlSeconds: input.ttlSeconds,
        maxConcurrentSessions: input.maxConcurrentSessions,
        updatedAt: now,
      },
    })
    .returning();
  return row;
}

export namespace SessionConfigRepository {
  export async function listAll(tx?: DBTransaction): Promise<SessionConfigSelectType[]> {
    const q = queryDb(tx);
    return q.select().from(sessionConfig);
  }

  export async function findByRoleName(roleName: string, tx?: DBTransaction): Promise<SessionConfigSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(sessionConfig).where(eq(sessionConfig.roleName, roleName)).limit(1);
    return row ?? null;
  }

  export async function upsert(input: SessionConfigUpsertInput, tx?: DBTransaction): Promise<SessionConfigSelectType> {
    const dbToQuery = tx ?? db;
    return upsertOne(input, dbToQuery);
  }

  export async function deleteByRoleName(roleName: string, tx?: DBTransaction): Promise<boolean> {
    const dbToQuery = tx ?? db;
    await dbToQuery.delete(sessionConfig).where(eq(sessionConfig.roleName, roleName));
    return true;
  }
}
