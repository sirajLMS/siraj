import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { CreditRepository } from "@/backend/db/repo/billing";
import { creditTransactions } from "@/backend/db/schema";
import { createTestUser, setupStudent, setupTeacher } from "@/backend/db/test/entity-setup";
import { expectSavepointError, runInRollback } from "@/backend/db/test/test-utils";
import { CreditAdjustmentType, CreditReason } from "@/backend/enum";
import type { CreditAdjustmentInsertInput, CreditTransactionSelectType, DBTransaction } from "@/backend/types";

/** Shared fixture: a fresh student plus the admin user credited on the ledger rows. */
interface AdjustmentFixture {
  studentId: string;
  adminUserId: string;
}

async function setupAdjustmentFixture(tx: DBTransaction): Promise<AdjustmentFixture> {
  const { student } = await setupStudent(tx);
  const adminUser = await createTestUser(tx, { name: "Adjustment Admin" });
  return { studentId: student.id, adminUserId: adminUser.id };
}

/** Builds a minimal ADD adjustment input; per-test fields go through overrides. */
function buildAdjustmentInput(
  fixture: AdjustmentFixture,
  overrides: Partial<CreditAdjustmentInsertInput> = {}
): CreditAdjustmentInsertInput {
  return {
    studentId: fixture.studentId,
    changeAmount: 2,
    reason: CreditReason.CREDIT_ADJUSTMENT_ADD,
    adjustmentType: CreditAdjustmentType.ADD,
    creditedByUserId: fixture.adminUserId,
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

/** Independent read-back through the tx, proving the row is really persisted. */
async function fetchPersistedRow(tx: DBTransaction, id: string): Promise<CreditTransactionSelectType> {
  const [row] = await tx.select().from(creditTransactions).where(eq(creditTransactions.id, id));
  if (!row) throw new Error(`credit_transaction ${id} was not persisted`);
  return row;
}

/** Asserts the invariants every adjustment row shares (payment/class links and carryover defaults). */
function expectAdjustmentDefaults(row: CreditTransactionSelectType, input: CreditAdjustmentInsertInput): void {
  expect(row.studentId).toBe(input.studentId);
  expect(row.changeAmount).toBe(input.changeAmount);
  expect(row.changeAmountHours).toBeNull();
  expect(row.reason).toBe(input.reason);
  expect(row.adjustmentType).toBe(input.adjustmentType);
  expect(row.creditedByUserId).toBe(input.creditedByUserId);
  expect(row.idempotencyKey).toBe(input.idempotencyKey);
  expect(row.sourcePaymentId).toBeNull();
  expect(row.classInstanceId).toBeNull();
}

describe("CreditRepository.createAdjustment", () => {
  test("persists an ADD row with null carryover fields and returns it", async () => {
    await runInRollback(async tx => {
      const fixture = await setupAdjustmentFixture(tx);
      const input = buildAdjustmentInput(fixture, { changeAmount: 3, notes: "Quarterly top-up" });

      const row = await CreditRepository.createAdjustment(tx, input);
      const persisted = await fetchPersistedRow(tx, row.id);

      expectAdjustmentDefaults(persisted, input);
      expect(persisted.notes).toBe("Quarterly top-up");
      expect(persisted.carryoverTeacherId).toBeNull();
      expect(persisted.carryoverFromDate).toBeNull();
      expect(persisted.carryoverToDate).toBeNull();
      expect(persisted.carryoverPaymentDate).toBeNull();
    });
  });

  test("persists a SUBTRACT row with a negative changeAmount and defaults notes to null", async () => {
    await runInRollback(async tx => {
      const fixture = await setupAdjustmentFixture(tx);
      const input = buildAdjustmentInput(fixture, {
        changeAmount: -2,
        reason: CreditReason.CREDIT_ADJUSTMENT_SUBTRACT,
        adjustmentType: CreditAdjustmentType.SUBTRACT,
      });

      const row = await CreditRepository.createAdjustment(tx, input);
      const persisted = await fetchPersistedRow(tx, row.id);

      expectAdjustmentDefaults(persisted, input);
      expect(persisted.changeAmount).toBe(-2);
      expect(persisted.notes).toBeNull();
    });
  });

  test("persists a SUBTRACT_WITH_CARRYOVER row with all carryover metadata", async () => {
    await runInRollback(async tx => {
      const fixture = await setupAdjustmentFixture(tx);
      const { teacher } = await setupTeacher(tx, { name: "Carryover Teacher" });
      const input = buildAdjustmentInput(fixture, {
        changeAmount: -4,
        reason: CreditReason.CREDIT_ADJUSTMENT_CARRYOVER,
        adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
        carryoverTeacherId: teacher.id,
        carryoverFromDate: "2026-02-01",
        carryoverToDate: "2026-02-28",
        carryoverPaymentDate: "2026-03-05",
      });

      const row = await CreditRepository.createAdjustment(tx, input);
      const persisted = await fetchPersistedRow(tx, row.id);

      expectAdjustmentDefaults(persisted, input);
      expect(persisted.carryoverTeacherId).toBe(teacher.id);
      expect(persisted.carryoverFromDate).toBe("2026-02-01");
      expect(persisted.carryoverToDate).toBe("2026-02-28");
      expect(persisted.carryoverPaymentDate).toBe("2026-03-05");
    });
  });

  test("stores notes verbatim for empty and unicode strings", async () => {
    await runInRollback(async tx => {
      const fixture = await setupAdjustmentFixture(tx);
      const unicodeNotes = "إضافة رصيد ✅ — ملاحظة خاصة";

      const emptyNotes = await CreditRepository.createAdjustment(tx, buildAdjustmentInput(fixture, { notes: "" }));
      const unicode = await CreditRepository.createAdjustment(
        tx,
        buildAdjustmentInput(fixture, { notes: unicodeNotes })
      );

      expect(emptyNotes.notes).toBe("");
      expect(unicode.notes).toBe(unicodeNotes);
    });
  });

  test("treats explicit null carryover fields identically to omitted ones", async () => {
    await runInRollback(async tx => {
      const fixture = await setupAdjustmentFixture(tx);
      const input = buildAdjustmentInput(fixture, {
        carryoverTeacherId: null,
        carryoverFromDate: null,
        carryoverToDate: null,
        carryoverPaymentDate: null,
      });

      const row = await CreditRepository.createAdjustment(tx, input);
      const persisted = await fetchPersistedRow(tx, row.id);

      expectAdjustmentDefaults(persisted, input);
      expect(persisted.carryoverTeacherId).toBeNull();
      expect(persisted.carryoverFromDate).toBeNull();
      expect(persisted.carryoverToDate).toBeNull();
      expect(persisted.carryoverPaymentDate).toBeNull();
    });
  });

  test("rejects a carryoverTeacherId that does not reference an existing teacher", async () => {
    await runInRollback(async tx => {
      const fixture = await setupAdjustmentFixture(tx);
      const input = buildAdjustmentInput(fixture, {
        adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
        reason: CreditReason.CREDIT_ADJUSTMENT_CARRYOVER,
        carryoverTeacherId: randomUUID(),
      });

      const error = await expectSavepointError(() => CreditRepository.createAdjustment(tx, input), tx);
      expect(error).toBeDefined();

      const leaked = await tx
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.idempotencyKey, input.idempotencyKey));
      expect(leaked).toHaveLength(0);
    });
  });

  test("rejects a duplicate idempotencyKey at the driver level", async () => {
    await runInRollback(async tx => {
      const fixture = await setupAdjustmentFixture(tx);
      const input = buildAdjustmentInput(fixture);

      await CreditRepository.createAdjustment(tx, input);
      const error = await expectSavepointError(() => CreditRepository.createAdjustment(tx, input), tx);
      expect(error).toBeDefined();

      const rows = await tx
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.idempotencyKey, input.idempotencyKey));
      expect(rows).toHaveLength(1);
    });
  });
});
