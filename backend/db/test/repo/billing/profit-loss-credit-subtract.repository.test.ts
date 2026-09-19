import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { CreditRepository } from "@/backend/db/repo/billing";
import { creditTransactions } from "@/backend/db/schema";
import { createMockClassInstance, createTestUser, setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CreditAdjustmentType, CreditReason } from "@/backend/enum";
import type { CreditTransactionInsertType, DBTransaction } from "@/backend/types";

/** Shared fixture: a student, a real teacher, and the admin user on the ledger rows. */
interface SubtractFixture {
  studentId: string;
  teacherId: string;
  adminUserId: string;
}

async function setupSubtractFixture(tx: DBTransaction): Promise<SubtractFixture> {
  const { student } = await setupStudent(tx);
  const { teacher } = await setupTeacher(tx, { name: "Subtract Teacher" });
  const adminUser = await createTestUser(tx, { name: "Subtract Admin" });
  return { studentId: student.id, teacherId: teacher.id, adminUserId: adminUser.id };
}

/**
 * Builds a SUBTRACT adjustment row linked to a class instance. The rows are
 * inserted directly because the production `createAdjustment` write path
 * always leaves `classInstanceId` null — the dashboard only counts rows that
 * carry a session link.
 */
function buildSubtractRow(
  fixture: SubtractFixture,
  classInstanceId: string,
  changeAmount: number,
  overrides: Partial<CreditTransactionInsertType> = {}
): CreditTransactionInsertType {
  return {
    studentId: fixture.studentId,
    changeAmount,
    reason: CreditReason.CREDIT_ADJUSTMENT_SUBTRACT,
    adjustmentType: CreditAdjustmentType.SUBTRACT,
    classInstanceId,
    creditedByUserId: fixture.adminUserId,
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

async function insertCreditRow(tx: DBTransaction, values: CreditTransactionInsertType): Promise<void> {
  const [row] = await tx.insert(creditTransactions).values(values).returning();
  if (!row) throw new Error(`credit_transaction ${values.idempotencyKey} was not persisted`);
}

describe("CreditRepository.findSubtractCreditsByInstanceIds", () => {
  test("returns the positive subtracted amount per instance", async () => {
    await runInRollback(async tx => {
      const fixture = await setupSubtractFixture(tx);
      const instance = await createMockClassInstance(tx, fixture.studentId, fixture.teacherId);
      await insertCreditRow(tx, buildSubtractRow(fixture, instance.id, -3));

      const map = await CreditRepository.findSubtractCreditsByInstanceIds([instance.id], tx);

      expect(map.size).toBe(1);
      expect(map.get(instance.id)?.amount).toBe(3);
      expect(map.get(instance.id)?.currency).toBeNull();
    });
  });

  test("instances without subtract rows are absent from the map", async () => {
    await runInRollback(async tx => {
      const fixture = await setupSubtractFixture(tx);
      const withRow = await createMockClassInstance(tx, fixture.studentId, fixture.teacherId);
      const withoutRow = await createMockClassInstance(tx, fixture.studentId, fixture.teacherId);
      await insertCreditRow(tx, buildSubtractRow(fixture, withRow.id, -2));

      const map = await CreditRepository.findSubtractCreditsByInstanceIds(
        [withRow.id, withoutRow.id, randomUUID()],
        tx
      );

      expect(map.size).toBe(1);
      expect(map.has(withRow.id)).toBe(true);
      expect(map.has(withoutRow.id)).toBe(false);
    });
  });

  test("an empty input array returns an empty map", async () => {
    await runInRollback(async tx => {
      const fixture = await setupSubtractFixture(tx);
      const instance = await createMockClassInstance(tx, fixture.studentId, fixture.teacherId);
      await insertCreditRow(tx, buildSubtractRow(fixture, instance.id, -4));

      const map = await CreditRepository.findSubtractCreditsByInstanceIds([], tx);

      expect(map.size).toBe(0);
    });
  });

  test("multiple subtract rows per instance sum correctly", async () => {
    await runInRollback(async tx => {
      const fixture = await setupSubtractFixture(tx);
      const instance = await createMockClassInstance(tx, fixture.studentId, fixture.teacherId);
      await insertCreditRow(tx, buildSubtractRow(fixture, instance.id, -2));
      await insertCreditRow(tx, buildSubtractRow(fixture, instance.id, -5));

      const map = await CreditRepository.findSubtractCreditsByInstanceIds([instance.id], tx);

      expect(map.get(instance.id)?.amount).toBe(7);
    });
  });

  test("ignores non-SUBTRACT rows linked to the instance", async () => {
    await runInRollback(async tx => {
      const fixture = await setupSubtractFixture(tx);
      const instance = await createMockClassInstance(tx, fixture.studentId, fixture.teacherId);
      await insertCreditRow(
        tx,
        buildSubtractRow(fixture, instance.id, -2, {
          adjustmentType: CreditAdjustmentType.ADD,
          reason: CreditReason.CREDIT_ADJUSTMENT_ADD,
        })
      );
      await insertCreditRow(
        tx,
        buildSubtractRow(fixture, instance.id, -1, {
          adjustmentType: CreditAdjustmentType.ADD,
          reason: CreditReason.DEDUCTION,
        })
      );

      const map = await CreditRepository.findSubtractCreditsByInstanceIds([instance.id], tx);

      expect(map.has(instance.id)).toBe(false);
    });
  });
});
