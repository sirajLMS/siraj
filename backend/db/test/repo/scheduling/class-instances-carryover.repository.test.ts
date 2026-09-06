import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { carryoverBalances, classInstances } from "@/backend/db/schema";
import { createMockClassInstance, setupTestEntities } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { CarryoverBalanceSelectType, ClassInstanceSelectType, DBTransaction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/** Minimal carryover row: only the NOT NULL columns without defaults matter for linking tests. */
async function createTestCarryover(
  tx: DBTransaction,
  teacherId: string,
  createdByUserId: string
): Promise<CarryoverBalanceSelectType> {
  const now = new Date();
  const [row] = await tx
    .insert(carryoverBalances)
    .values({
      teacherId,
      payable: "100.00",
      teacherCurrency: CurrencyCode.USD,
      createdByUserId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("Failed to create test carryover balance");
  return row;
}

interface CarryoverScenario {
  teacherId: string;
  userId: string;
  instances: ClassInstanceSelectType[];
}

/** Seeds a student/teacher pair plus unlinked class instances. */
async function setupCarryoverScenario(
  tx: DBTransaction,
  prefix: string,
  instanceCount: 1 | 2 | 3
): Promise<CarryoverScenario> {
  const { student, teacher, teacherUser } = await setupTestEntities(tx, prefix, { skipInstance: true });
  // Sequential inserts on purpose: the rollback transaction runs on a single
  // connection, so parallel statements would exercise the pg driver's
  // deprecated queued-query path.
  const first = await createMockClassInstance(tx, student.id, teacher.id);
  const instances = [first];
  if (instanceCount >= 2) instances.push(await createMockClassInstance(tx, student.id, teacher.id));
  if (instanceCount >= 3) instances.push(await createMockClassInstance(tx, student.id, teacher.id));
  return { teacherId: teacher.id, userId: teacherUser.id, instances };
}

/** Asserts a re-read row points at the carryover and was touched by the link update. */
function expectLinked(
  after: ClassInstanceSelectType | null,
  original: ClassInstanceSelectType,
  carryoverId: string
): void {
  expect(after?.carryoverBalanceId).toBe(carryoverId);
  expect(after?.updatedAt.getTime()).toBeGreaterThanOrEqual(original.updatedAt.getTime());
}

describe("Class instance carryover linking", () => {
  describe("getByIdsForUpdate", () => {
    test("locks and returns every matching row inside the caller's transaction", async () => {
      await runInRollback(async tx => {
        const scenario = await setupCarryoverScenario(tx, "CarryLock", 2);
        const [first, second] = scenario.instances;
        if (!first || !second) throw new Error("expected two seeded instances");

        const locked = await SchedulingRepository.getByIdsForUpdate([first.id, second.id, randomUUID()], tx);

        expect(locked).toHaveLength(2);
        expect(locked.map(row => row.id)).toEqual(expect.arrayContaining([first.id, second.id]));
        for (const row of locked) {
          expect(row.teacherId).toBe(scenario.teacherId);
          expect(row.carryoverBalanceId).toBeNull();
        }
      });
    });

    test("returns an empty array for an empty id list without touching the database", async () => {
      await runInRollback(async tx => {
        const locked = await SchedulingRepository.getByIdsForUpdate([], tx);
        expect(locked).toEqual([]);
      });
    });

    test("excludes soft-deleted instances from the lockable read", async () => {
      await runInRollback(async tx => {
        const scenario = await setupCarryoverScenario(tx, "CarrySoftDel", 2);
        const [kept, removed] = scenario.instances;
        if (!kept || !removed) throw new Error("expected two seeded instances");
        await tx.update(classInstances).set({ deletedAt: new Date() }).where(eq(classInstances.id, removed.id));

        const locked = await SchedulingRepository.getByIdsForUpdate([kept.id, removed.id], tx);

        expect(locked.map(row => row.id)).toEqual([kept.id]);
        expect(locked[0]?.deletedAt).toBeNull();
      });
    });

    test("returns rows ordered by id regardless of the input order (deterministic lock order)", async () => {
      await runInRollback(async tx => {
        const scenario = await setupCarryoverScenario(tx, "CarryOrder", 3);
        const [first, second, third] = scenario.instances;
        if (!first || !second || !third) throw new Error("expected three seeded instances");
        const ascending = [first.id, second.id, third.id].toSorted((a, b) => a.localeCompare(b));

        const locked = await SchedulingRepository.getByIdsForUpdate(
          [ascending[2] ?? "", ascending[0] ?? "", ascending[1] ?? ""],
          tx
        );

        expect(locked.map(row => row.id)).toEqual(ascending);
      });
    });
  });

  describe("linkToCarryover", () => {
    test("links a batch of instances to a carryover and returns the updated rows", async () => {
      await runInRollback(async tx => {
        const scenario = await setupCarryoverScenario(tx, "CarryLink", 2);
        const [first, second] = scenario.instances;
        if (!first || !second) throw new Error("expected two seeded instances");
        const carryover = await createTestCarryover(tx, scenario.teacherId, scenario.userId);

        const linked = await SchedulingRepository.linkToCarryover([first.id, second.id], carryover.id, tx);

        expect(linked).toHaveLength(2);
        for (const row of linked) {
          expect(row.carryoverBalanceId).toBe(carryover.id);
        }
        expectLinked(await SchedulingRepository.getById(first.id, tx), first, carryover.id);
        expectLinked(await SchedulingRepository.getById(second.id, tx), second, carryover.id);
      });
    });

    test("returns an empty array for an empty instance list", async () => {
      await runInRollback(async tx => {
        const scenario = await setupCarryoverScenario(tx, "CarryLinkEmpty", 1);
        const carryover = await createTestCarryover(tx, scenario.teacherId, scenario.userId);
        const linked = await SchedulingRepository.linkToCarryover([], carryover.id, tx);
        expect(linked).toEqual([]);
      });
    });
  });

  describe("findByCarryoverId", () => {
    test("returns only the instances linked to the requested carryover", async () => {
      await runInRollback(async tx => {
        const scenario = await setupCarryoverScenario(tx, "CarryFind", 3);
        const [first, second, other] = scenario.instances;
        if (!first || !second || !other) throw new Error("expected three seeded instances");
        const carryoverA = await createTestCarryover(tx, scenario.teacherId, scenario.userId);
        const carryoverB = await createTestCarryover(tx, scenario.teacherId, scenario.userId);

        await SchedulingRepository.linkToCarryover([first.id, second.id], carryoverA.id, tx);
        await SchedulingRepository.linkToCarryover([other.id], carryoverB.id, tx);

        const forA = await SchedulingRepository.findByCarryoverId(carryoverA.id, tx);
        expect(forA.map(row => row.id)).toEqual(expect.arrayContaining([first.id, second.id]));
        expect(forA).toHaveLength(2);
        expect(forA.every(row => row.carryoverBalanceId === carryoverA.id)).toBe(true);

        const forB = await SchedulingRepository.findByCarryoverId(carryoverB.id, tx);
        expect(forB.map(row => row.id)).toEqual([other.id]);

        const unknown = await SchedulingRepository.findByCarryoverId(randomUUID(), tx);
        expect(unknown).toEqual([]);
      });
    });
  });

  describe("unlinkFromCarryover", () => {
    test("detaches linked instances by nulling the carryover link", async () => {
      await runInRollback(async tx => {
        const scenario = await setupCarryoverScenario(tx, "CarryUnlink", 2);
        const [first, second] = scenario.instances;
        if (!first || !second) throw new Error("expected two seeded instances");
        const carryover = await createTestCarryover(tx, scenario.teacherId, scenario.userId);
        await SchedulingRepository.linkToCarryover([first.id, second.id], carryover.id, tx);

        const unlinked = await SchedulingRepository.unlinkFromCarryover([first.id], tx);

        expect(unlinked).toHaveLength(1);
        expect(unlinked[0]?.id).toBe(first.id);
        expect(unlinked[0]?.carryoverBalanceId).toBeNull();
        expect(unlinked[0]?.updatedAt.getTime()).toBeGreaterThanOrEqual(first.updatedAt.getTime());

        const remaining = await SchedulingRepository.findByCarryoverId(carryover.id, tx);
        expect(remaining.map(row => row.id)).toEqual([second.id]);
      });
    });

    test("returns an empty array for an empty instance list", async () => {
      await runInRollback(async tx => {
        const unlinked = await SchedulingRepository.unlinkFromCarryover([], tx);
        expect(unlinked).toEqual([]);
      });
    });
  });
});
