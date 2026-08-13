import { eq, inArray } from "drizzle-orm";
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

async function upsertManyNext(
  inputs: readonly SessionConfigUpsertInput[],
  dbToQuery: DBQueryExecutor,
  index: number,
  results: SessionConfigSelectType[]
): Promise<SessionConfigSelectType[]> {
  if (index >= inputs.length) return results;
  const row = await upsertOne(inputs[index], dbToQuery);
  results.push(row);
  return upsertManyNext(inputs, dbToQuery, index + 1, results);
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

  export async function findById(id: string, tx?: DBTransaction): Promise<SessionConfigSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(sessionConfig).where(eq(sessionConfig.id, id)).limit(1);
    return row ?? null;
  }

  export async function listByRoleNames(roleNames: string[], tx?: DBTransaction): Promise<SessionConfigSelectType[]> {
    if (roleNames.length === 0) return [];
    const q = queryDb(tx);
    return q.select().from(sessionConfig).where(inArray(sessionConfig.roleName, roleNames));
  }

  export async function upsert(input: SessionConfigUpsertInput, tx?: DBTransaction): Promise<SessionConfigSelectType> {
    const dbToQuery = tx ?? db;
    return upsertOne(input, dbToQuery);
  }

  export async function upsertMany(
    inputs: readonly SessionConfigUpsertInput[],
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType[]> {
    if (inputs.length === 0) return [];
    const dbToQuery = tx ?? db;
    return upsertManyNext(inputs, dbToQuery, 0, []);
  }

  export async function deleteByRoleName(roleName: string, tx?: DBTransaction): Promise<boolean> {
    const dbToQuery = tx ?? db;
    await dbToQuery.delete(sessionConfig).where(eq(sessionConfig.roleName, roleName));
    return true;
  }

  async function updateRoleField(
    roleName: string,
    patch: Partial<Pick<SessionConfigSelectType, "ttlSeconds" | "maxConcurrentSessions" | "updatedAt">>,
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType | null> {
    const dbToQuery = tx ?? db;
    const [row] = await dbToQuery
      .update(sessionConfig)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(sessionConfig.roleName, roleName))
      .returning();
    return row ?? null;
  }

  export async function updateTtl(
    roleName: string,
    ttlSeconds: number,
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType | null> {
    return updateRoleField(roleName, { ttlSeconds }, tx);
  }

  export async function updateMaxConcurrent(
    roleName: string,
    maxConcurrentSessions: number,
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType | null> {
    return updateRoleField(roleName, { maxConcurrentSessions }, tx);
  }
}
