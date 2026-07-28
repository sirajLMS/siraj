import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classInstances } from "@/backend/db/schema";
import type { ClassInstanceEntity, ClassInstanceInsertInput } from "@/backend/types";

export type ClassInstanceUpsertManyOptions = {
  chunkSize?: number;
  updatedAt?: Date;
  tx?: DBTransaction;
};

type ClassInstanceState = Pick<ClassInstanceEntity, "executionState" | "outcome">;

function statesMatch(existing: ClassInstanceState, desired: ClassInstanceInsertInput): boolean {
  return existing.executionState === desired.executionState && existing.outcome === desired.outcome;
}

async function updateSchedulingOnly(
  t: DBTransaction,
  id: string,
  instance: ClassInstanceInsertInput,
  updatedAt: Date
): Promise<ClassInstanceEntity> {
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

async function promoteSeedShellToTakenCompleted(
  t: DBTransaction,
  id: string,
  instance: ClassInstanceInsertInput,
  updatedAt: Date
): Promise<void> {
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
  instance: ClassInstanceInsertInput,
  updatedAt: Date
): Promise<void> {
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
  existing: ClassInstanceEntity,
  instance: ClassInstanceInsertInput,
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
  instances: ClassInstanceInsertInput[],
  upsertRow: (t: DBTransaction, instance: ClassInstanceInsertInput, updatedAt: Date) => Promise<ClassInstanceEntity>,
  options?: ClassInstanceUpsertManyOptions
): Promise<ClassInstanceEntity[]> {
  if (instances.length === 0) return [];

  const chunkSize = options?.chunkSize ?? 100;
  const updatedAt = options?.updatedAt ?? new Date();

  const runner = async (t: DBTransaction): Promise<ClassInstanceEntity[]> => {
    const results: ClassInstanceEntity[] = [];
    for (let i = 0; i < instances.length; i += chunkSize) {
      const chunk = instances.slice(i, i + chunkSize);
      for (const instance of chunk) {
        results.push(await upsertRow(t, instance, updatedAt));
      }
    }
    return results;
  };

  return options?.tx ? runner(options.tx) : db.transaction(runner);
}

/** Production upsert: may update execution state directly on idempotency-key conflict. */
export async function upsertProductionClassInstance(
  t: DBTransaction,
  instance: ClassInstanceInsertInput,
  updatedAt: Date
): Promise<ClassInstanceEntity> {
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
  instance: ClassInstanceInsertInput,
  updatedAt: Date
): Promise<ClassInstanceEntity> {
  const [inserted] = await t
    .insert(classInstances)
    .values(instance)
    .onConflictDoNothing({ target: classInstances.idempotencyKey })
    .returning();

  if (inserted) {
    return inserted;
  }

  if (!instance.idempotencyKey) {
    throw new Error("Seed class instance upsert requires an idempotency key.");
  }

  const [existing] = await t
    .select()
    .from(classInstances)
    .where(eq(classInstances.idempotencyKey, instance.idempotencyKey))
    .limit(1);

  if (!existing) {
    throw new Error(`Seed class instance conflict missing row for key ${instance.idempotencyKey}.`);
  }

  if (!statesMatch(existing, instance)) {
    await applyDesiredSeedState(t, existing, instance, updatedAt);
  } else {
    await t
      .update(classInstances)
      .set({
        actualStartAt: instance.actualStartAt,
        actualEndAt: instance.actualEndAt,
        updatedAt,
      })
      .where(eq(classInstances.id, existing.id));
  }

  return updateSchedulingOnly(t, existing.id, instance, updatedAt);
}
