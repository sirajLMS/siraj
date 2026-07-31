import { eq, inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { sessionConfig } from "@/backend/db/schema";
import type { SessionConfigSelectType, SessionConfigUpsertInput } from "@/backend/types";

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
    const queryDb = tx ?? db;
    const now = new Date();
    const [row] = await queryDb
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

  export async function upsertMany(
    inputs: readonly SessionConfigUpsertInput[],
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType[]> {
    if (inputs.length === 0) return [];
    const queryDb = tx ?? db;
    const results: SessionConfigSelectType[] = [];
    for (const input of inputs) {
      const [row] = await queryDb
        .insert(sessionConfig)
        .values({
          roleName: input.roleName,
          ttlSeconds: input.ttlSeconds,
          maxConcurrentSessions: input.maxConcurrentSessions,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: sessionConfig.roleName,
          set: {
            ttlSeconds: input.ttlSeconds,
            maxConcurrentSessions: input.maxConcurrentSessions,
            updatedAt: new Date(),
          },
        })
        .returning();
      results.push(row);
    }
    return results;
  }

  export async function deleteByRoleName(roleName: string, tx?: DBTransaction): Promise<boolean> {
    const queryDb = tx ?? db;
    await queryDb.delete(sessionConfig).where(eq(sessionConfig.roleName, roleName));
    return true;
  }

  async function updateRoleField(
    roleName: string,
    patch: Partial<Pick<SessionConfigSelectType, "ttlSeconds" | "maxConcurrentSessions" | "updatedAt">>,
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType | null> {
    const queryDb = tx ?? db;
    const [row] = await queryDb
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
