import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/types";
import { db } from "@/backend/db/drizzleDb";
import { classInstances } from "@/backend/db/schema";
import type { ClassInstanceInsertType, ClassInstanceSelectType } from "@/backend/types";

export type ClassInstanceUpsertManyOptions = {
  chunkSize?: number;
  updatedAt?: Date;
  tx?: DBTransaction;
};

type ClassInstanceState = Pick<ClassInstanceSelectType, "executionState" | "outcome">;

function statesMatch(existing: ClassInstanceState, desired: ClassInstanceInsertType): boolean {
  return existing.executionState === desired.executionState && existing.outcome === desired.outcome;
}

async function updateSchedulingOnly(
  t: DBTransaction,
  id: string,
  instance: ClassInstanceInsertType,
  updatedAt: Date
): Promise<ClassInstanceSelectType> {
  const [row] = await t
    .update(classInstances)
    .set({
      scheduledStartAt: instance.scheduledStartAt,
      scheduledEndAt: instance.scheduledEndAt,
      durationMinutes: instance.durationMinutes,
      classType: instance.classType,
      updatedAt,
    })
    .where(eq(classInstances.id, id))
    .returning();
  if (!row) {
    throw new Error(`Failed to update class instance ${id} during seed upsert.`);
  }
  return row;
}

/**
 * Shared first step for seed shell promotion: sets ACTIVATED/PENDING with no
 * actual start/end timestamps. Used by both `promoteSeedShellToTakenCompleted`
 * and `promoteSeedShellToRunning` as the initial NOT_ACTIVATED → ACTIVATED transition.
 */
async function activateSeedShell(t: DBTransaction, id: string, updatedAt: Date): Promise<void> {
  await t
    .update(classInstances)
    .set({
      executionState: "ACTIVATED",
      outcome: "PENDING",
      actualStartAt: null,
      actualEndAt: null,
      updatedAt,
    })
    .where(eq(classInstances.id, id));
}

async function promoteSeedShellToTakenCompleted(
  t: DBTransaction,
  id: string,
  instance: ClassInstanceInsertType,
  updatedAt: Date
): Promise<void> {
  await activateSeedShell(t, id, updatedAt);

  await t
    .update(classInstances)
    .set({
      executionState: "RUNNING",
      outcome: "PENDING",
      actualStartAt: instance.actualStartAt,
      actualEndAt: null,
      updatedAt,
    })
    .where(eq(classInstances.id, id));

  await t
    .update(classInstances)
    .set({
      executionState: "COMPLETED",
      outcome: "TAKEN",
      actualStartAt: instance.actualStartAt,
      actualEndAt: instance.actualEndAt,
      updatedAt,
    })
    .where(eq(classInstances.id, id));
}

async function promoteSeedShellToRunning(
  t: DBTransaction,
  id: string,
  instance: ClassInstanceInsertType,
  updatedAt: Date
): Promise<void> {
  await activateSeedShell(t, id, updatedAt);

  await t
    .update(classInstances)
    .set({
      executionState: "RUNNING",
      outcome: "PENDING",
      actualStartAt: instance.actualStartAt,
      actualEndAt: instance.actualEndAt,
      updatedAt,
    })
    .where(eq(classInstances.id, id));
}

async function applyDesiredSeedState(
  t: DBTransaction,
  existing: ClassInstanceSelectType,
  instance: ClassInstanceInsertType,
  updatedAt: Date
): Promise<void> {
  if (existing.executionState !== "NOT_ACTIVATED" || existing.outcome !== "PENDING") {
    return;
  }

  if (instance.executionState === "COMPLETED" && instance.outcome === "TAKEN") {
    await promoteSeedShellToTakenCompleted(t, existing.id, instance, updatedAt);
    return;
  }

  if (instance.executionState === "COMPLETED" && (instance.outcome === "ABSENT" || instance.outcome === "LEAVE")) {
    await t
      .update(classInstances)
      .set({
        executionState: "COMPLETED",
        outcome: instance.outcome,
        actualStartAt: instance.actualStartAt,
        actualEndAt: instance.actualEndAt,
        updatedAt,
      })
      .where(eq(classInstances.id, existing.id));
    return;
  }

  if (instance.executionState === "RUNNING") {
    await promoteSeedShellToRunning(t, existing.id, instance, updatedAt);
  }
}

/**
 * Shared chunking + transaction wrapper for class instance bulk upserts.
 */
export async function runClassInstanceUpsertMany(
  instances: ClassInstanceInsertType[],
  upsertRow: (t: DBTransaction, instance: ClassInstanceInsertType, updatedAt: Date) => Promise<ClassInstanceSelectType>,
  options?: ClassInstanceUpsertManyOptions
): Promise<ClassInstanceSelectType[]> {
  if (instances.length === 0) return [];

  const chunkSize = options?.chunkSize ?? 100;
  const updatedAt = options?.updatedAt ?? new Date();

  const runner = async (t: DBTransaction): Promise<ClassInstanceSelectType[]> => {
    const chunks: ClassInstanceInsertType[][] = [];
    for (let i = 0; i < instances.length; i += chunkSize) {
      chunks.push(instances.slice(i, i + chunkSize));
    }

    const results: ClassInstanceSelectType[] = [];
    await chunks.reduce(async (prev, chunk) => {
      await prev;
      const chunkResults = await chunk.reduce(async (prevChunk, instance) => {
        const prevResult = await prevChunk;
        const row = await upsertRow(t, instance, updatedAt);
        return [...prevResult, row];
      }, Promise.resolve<ClassInstanceSelectType[]>([]));
      results.push(...chunkResults);
    }, Promise.resolve());
    return results;
  };

  return options?.tx ? runner(options.tx) : db.transaction(runner);
}

/** Production upsert: may update execution state directly on idempotency-key conflict. */
export async function upsertProductionClassInstance(
  t: DBTransaction,
  instance: ClassInstanceInsertType,
  updatedAt: Date
): Promise<ClassInstanceSelectType> {
  const [inserted] = await t
    .insert(classInstances)
    .values(instance)
    .onConflictDoUpdate({
      target: classInstances.idempotencyKey,
      set: {
        scheduledStartAt: instance.scheduledStartAt,
        scheduledEndAt: instance.scheduledEndAt,
        executionState: instance.executionState,
        outcome: instance.outcome,
        actualStartAt: instance.actualStartAt,
        actualEndAt: instance.actualEndAt,
        updatedAt,
      },
    })
    .returning();
  return inserted;
}

/**
 * Seed upsert: promotes NOT_ACTIVATED/PENDING shells through valid transitions so
 * `fn_enforce_class_instance_transition` is not violated on re-seed.
 */
export async function upsertSeedClassInstance(
  t: DBTransaction,
  instance: ClassInstanceInsertType,
  updatedAt: Date
): Promise<ClassInstanceSelectType> {
  const [inserted] = await t
    .insert(classInstances)
    .values(instance)
    .onConflictDoNothing({ target: classInstances.idempotencyKey })
    .returning();

  if (inserted) {
    return inserted;
  }

  if (instance.idempotencyKey == null) {
    throw new Error("Seed class instance upsert requires an idempotency key.");
  }

  const [existing] = await t
    .select()
    .from(classInstances)
    .where(eq(classInstances.idempotencyKey, instance.idempotencyKey))
    .limit(1);

  if (existing) {
    if (statesMatch(existing, instance)) {
      await t
        .update(classInstances)
        .set({
          actualStartAt: instance.actualStartAt,
          actualEndAt: instance.actualEndAt,
          updatedAt,
        })
        .where(eq(classInstances.id, existing.id));
    } else {
      await applyDesiredSeedState(t, existing, instance, updatedAt);
    }

    return updateSchedulingOnly(t, existing.id, instance, updatedAt);
  }

  throw new Error(`Seed class instance conflict missing row for key ${instance.idempotencyKey}.`);
}
