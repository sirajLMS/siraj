import { inArray } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { bulkInsertOnConflictDoNothing, DEFAULT_BULK_CHUNK_SIZE } from "@/backend/db/repo/shared";
import { classStatusEvents } from "@/backend/db/schema";
import type { ClassStatusEventInsertType, ClassStatusEventSelectType, DBTransaction } from "@/backend/types";

export type ClassStatusEventSeedInsertInput = Omit<ClassStatusEventInsertType, "id">;

async function runInTransaction<T>(tx: DBTransaction | undefined, fn: (t: DBTransaction) => Promise<T>): Promise<T> {
  return tx ? fn(tx) : db.transaction(fn);
}

async function insertChunks(
  tx: DBTransaction,
  inputs: readonly ClassStatusEventSeedInsertInput[],
  chunkCount: number
): Promise<ClassStatusEventSelectType[]> {
  async function processChunk(index: number, acc: ClassStatusEventSelectType[]): Promise<ClassStatusEventSelectType[]> {
    if (index >= chunkCount) return acc;
    const chunk = inputs.slice(
      index * DEFAULT_BULK_CHUNK_SIZE,
      index * DEFAULT_BULK_CHUNK_SIZE + DEFAULT_BULK_CHUNK_SIZE
    );
    const inserted = await tx.insert(classStatusEvents).values(chunk).returning();
    return processChunk(index + 1, [...acc, ...inserted]);
  }
  return processChunk(0, []);
}

export namespace ClassStatusEventsRepository {
  export async function findFirstByClassInstanceIds(
    classInstanceIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, ClassStatusEventSelectType>> {
    const map = new Map<string, ClassStatusEventSelectType>();
    if (classInstanceIds.length === 0) return map;

    const q = queryDb(tx);
    const rows = await q
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

    const q = queryDb(tx);
    const rows = await q
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
      const chunkCount = Math.ceil(inputs.length / DEFAULT_BULK_CHUNK_SIZE);
      return insertChunks(t, inputs, chunkCount);
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
