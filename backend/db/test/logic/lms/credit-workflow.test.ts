import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { CreditRepository, StudentRepository } from "@/backend/db/repo";
import { creditTransactions } from "@/backend/db/schema";
import {
  createTestCreditTransaction,
  createTestUser,
  setupStudent,
  setupTeacher,
  setupTestEntities,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CreditReason } from "@/backend/enum";
import type { ClassInstanceEntity } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

let tErrors: ErrorsLabels;
beforeAll(async () => {
  tErrors = await getServerTranslations("en", "errors");
});

function requireInstance(instance: ClassInstanceEntity | null): ClassInstanceEntity {
  if (!instance) {
    throw new Error("setupTestEntities returned a null instance — pass skipInstance:false");
  }
  return instance;
}

describe("Credit workflow — purchase, deduct, refund, idempotency", () => {
  test("records a purchase, deducts for a booking, verifies balance decrease, refunds and verifies balance restored", async () => {
    await runInRollback(async tx => {
      // 1. Create teacher, parent, student, class instance via setupTestEntities
      const entities = await setupTestEntities(tx, "CreditFlow", { classesRemaining: 0 });
      const instance = requireInstance(entities.instance);

      // The creditedByUserId for the purchase ledger rows — use the parent user.
      const creditedByUserId = entities.parentUser.id;

      // 2. Record a credit purchase of 10 hours via CreditRepository.createPurchase
      const purchaseKey = randomUUID();
      await CreditRepository.createPurchase(tx, {
        studentId: entities.student.id,
        changeAmount: 10,
        creditedByUserId,
        idempotencyKey: purchaseKey,
        notes: "Initial purchase of 10 hours",
      });

      // Apply the purchase to the student balance via StudentRepository.addClasses
      await StudentRepository.addClasses(entities.student.id, 10, tErrors, undefined, tx);

      const balanceAfterPurchase = await CreditRepository.getBalance(tx, entities.student.id);
      expect(balanceAfterPurchase.classesTotal).toBe(10);
      expect(balanceAfterPurchase.classesRemaining).toBe(10);

      // 3. Deduct for booking
      const deductKey = randomUUID();
      const deductionRow = await CreditRepository.deductForBooking(tx, {
        studentId: entities.student.id,
        classInstanceId: instance.id,
        creditedByUserId,
        idempotencyKey: deductKey,
      });

      // Apply the deduction to the student balance via StudentRepository.deductClasses
      await StudentRepository.deductClasses(entities.student.id, 1, tErrors, undefined, tx);

      // 4. Verify student balance decreased by 1
      const balanceAfterDeduct = await CreditRepository.getBalance(tx, entities.student.id);
      expect(balanceAfterDeduct.classesRemaining).toBe(9);

      // 5. Verify ledger has a DEDUCTION entry for this class instance
      const deductions = await CreditRepository.findByClassInstanceId(tx, instance.id, CreditReason.DEDUCTION);
      expect(deductions).toHaveLength(1);
      expect(deductions[0]?.id).toBe(deductionRow.id);
      expect(deductions[0]?.changeAmount).toBe(-1);

      // 6. Refund on cancel
      const refundKey = randomUUID();
      const refundRow = await CreditRepository.refundOnCancel(tx, {
        studentId: entities.student.id,
        classInstanceId: instance.id,
        creditedByUserId,
        idempotencyKey: refundKey,
      });

      // Apply the refund to the student balance via StudentRepository.addClasses
      await StudentRepository.addClasses(entities.student.id, 1, tErrors, undefined, tx);

      // 7. Verify student balance restored
      const balanceAfterRefund = await CreditRepository.getBalance(tx, entities.student.id);
      expect(balanceAfterRefund.classesRemaining).toBe(10);

      // 8. Verify ledger has a REFUND entry for this class instance
      const refunds = await CreditRepository.findByClassInstanceId(tx, instance.id, CreditReason.REFUND);
      expect(refunds).toHaveLength(1);
      expect(refunds[0]?.id).toBe(refundRow.id);
      expect(refunds[0]?.changeAmount).toBe(1);

      // Confirm that the aggregate ledger matches the student balance
      const aggregate = await CreditRepository.aggregateBalanceFromLedger(tx, entities.student.id);
      expect(aggregate.classesTotal).toBe(10);
      expect(aggregate.classesRemaining).toBe(10);
    });
  });

  test("idempotency: duplicating a deduct with the same idempotencyKey does not duplicate or change balance", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "CreditIdemp", { classesRemaining: 10 });
      const instance = requireInstance(entities.instance);
      const creditedByUserId = entities.parentUser.id;

      const idempotencyKey = randomUUID();

      const firstRow = await CreditRepository.deductForBooking(tx, {
        studentId: entities.student.id,
        classInstanceId: instance.id,
        creditedByUserId,
        idempotencyKey,
      });
      await StudentRepository.deductClasses(entities.student.id, 1, tErrors, undefined, tx);

      const balanceAfterFirstDeduct = await CreditRepository.getBalance(tx, entities.student.id);
      expect(balanceAfterFirstDeduct.classesRemaining).toBe(9);

      // Second call with the same idempotencyKey must be rejected by the unique index.
      let duplicateSucceeded = true;
      try {
        await CreditRepository.deductForBooking(tx, {
          studentId: entities.student.id,
          classInstanceId: instance.id,
          creditedByUserId,
          idempotencyKey,
        });
      } catch {
        duplicateSucceeded = false;
      }
      expect(duplicateSucceeded).toBe(false);

      // The balance is unchanged after the rejected call.
      const balanceAfterDupAttempt = await CreditRepository.getBalance(tx, entities.student.id);
      expect(balanceAfterDupAttempt.classesRemaining).toBe(9);

      // Only one ledger row exists with that idempotency key.
      const rowsForKey = await tx
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.idempotencyKey, idempotencyKey));
      expect(rowsForKey).toHaveLength(1);
      expect(rowsForKey[0]?.id).toBe(firstRow.id);
    });
  });

  test("findByIdempotencyKeys returns all purchase and deduction rows for the workflow", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, { name: "Idemp Parent User" });
      const { teacher } = await setupTeacher(tx);
      const teacherUser = await createTestUser(tx, { name: "Credit Admin" });
      const entities = await setupTestEntities(tx, "IdempKeys", { classesRemaining: 0 });

      const purchaseKey = randomUUID();
      const deductionKey = randomUUID();
      await createTestCreditTransaction(tx, student.id, teacherUser.id, {
        idempotencyKey: purchaseKey,
        changeAmount: 5,
        reason: CreditReason.PURCHASE,
      });

      // Need a class instance for the deduction row's classInstanceId column.
      const inst = requireInstance(entities.instance);
      await createTestCreditTransaction(tx, student.id, teacherUser.id, {
        idempotencyKey: deductionKey,
        changeAmount: -1,
        reason: CreditReason.DEDUCTION,
        classInstanceId: inst.id,
      });

      const found = await CreditRepository.findByIdempotencyKeys([purchaseKey, deductionKey], tx);

      expect(found).toHaveLength(2);
      const reasons = found.map(r => r.reason);
      expect(reasons).toContain(CreditReason.PURCHASE);
      expect(reasons).toContain(CreditReason.DEDUCTION);
      expect(teacher.id).toBeDefined();
    });
  });
});
