import { inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { bulkInsertOnConflictDoNothing, DEFAULT_BULK_CHUNK_SIZE } from "@/backend/db/repo/shared/bulk-upsert";
import { classStatusEvents } from "@/backend/db/schema/classes/scheduling";
import type { ClassStatusEventSelectType } from "@/backend/types/scheduling/class-status-event.types";

export type ClassStatusEventSeedInsertInput = {
  classInstanceId: string;
  eventType: string;
  fromState: Record<string, unknown> | null;
  toState: Record<string, unknown> | null;
  description: string | null;
  actorUserId: string | null;
  createdAt: Date;
};

async function runInTransaction<T>(tx: DBTransaction | undefined, fn: (t: DBTransaction) => Promise<T>): Promise<T> {
  return tx ? fn(tx) : db.transaction(fn);
}

export namespace ClassStatusEventsRepository {
  export async function findFirstByClassInstanceIds(
    classInstanceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, ClassStatusEventSelectType>> {
    const map = new Map<string, ClassStatusEventSelectType>();
    if (classInstanceIds.length === 0) return map;

    const queryDb = tx ?? db;
    const rows = await queryDb
      .select()
      .from(classStatusEvents)
      .where(inArray(classStatusEvents.classInstanceId, [...classInstanceIds]));

    for (const row of rows) {
      if (!map.has(row.classInstanceId)) {
        map.set(row.classInstanceId, row);
      }
    }
    return map;
  }

  export async function listClassInstanceIdsWithEvents(
    classInstanceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Set<string>> {
    if (classInstanceIds.length === 0) return new Set();

    const queryDb = tx ?? db;
    const rows = await queryDb
      .selectDistinct({ classInstanceId: classStatusEvents.classInstanceId })
      .from(classStatusEvents)
      .where(inArray(classStatusEvents.classInstanceId, [...classInstanceIds]));

    return new Set(rows.map(row => row.classInstanceId));
  }

  export async function createMany(
    inputs: readonly ClassStatusEventSeedInsertInput[],
    tx?: DBTransaction
  ): Promise<ClassStatusEventSelectType[]> {
    if (inputs.length === 0) return [];

    return runInTransaction(tx, async t => {
      const results: ClassStatusEventSelectType[] = [];
      for (let i = 0; i < inputs.length; i += DEFAULT_BULK_CHUNK_SIZE) {
        const chunk = inputs.slice(i, i + DEFAULT_BULK_CHUNK_SIZE);
        const inserted = await t.insert(classStatusEvents).values(chunk).returning();
        results.push(...inserted);
      }
      return results;
    });
  }

  export async function insertManyOnConflictDoNothing(
    inputs: readonly ClassStatusEventSeedInsertInput[],
    tx?: DBTransaction
  ): Promise<void> {
    if (inputs.length === 0) return;
    await bulkInsertOnConflictDoNothing(classStatusEvents, [...inputs], { tx });
  }
}
