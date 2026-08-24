import { beforeAll, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { BillingRepository } from "@/backend/db/repo/billing";
import { StudentRepository } from "@/backend/db/repo/students";
import { invoices, parents, students, users } from "@/backend/db/schema";
import { executeTxSql, generateTestPassword, runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

let tErrors: ErrorsLabels;
beforeAll(() => {
  tErrors = getServerTranslations("en").errorsTranslations;
});

const getCommonDates = () => ({ createdAt: new Date(), updatedAt: new Date() });

async function setupBaseTest(tx: DBTransaction, suffix: string) {
  const [testUser] = await tx
    .insert(users)
    .values({
      name: `${suffix} User`,
      email: `${suffix.toLowerCase().replace(/\s+/g, "-")}-test@example.com`,
      password: generateTestPassword(),
      ...getCommonDates(),
    })
    .returning();

  const [testParent] = await tx
    .insert(parents)
    .values({
      userId: testUser.id,
      status: "REGULAR",
      ...getCommonDates(),
    })
    .returning();

  return { testUser, testParent };
}

async function setupStudentTest(tx: DBTransaction, suffix: string, classesTotal = 10) {
  const { testParent } = await setupBaseTest(tx, suffix);
  const [testStudentUser] = await tx
    .insert(users)
    .values({
      name: `${suffix} Student User`,
      email: `${suffix.toLowerCase().replace(/\s+/g, "-")}-student@example.com`,
      password: generateTestPassword(),
      ...getCommonDates(),
    })
    .returning();
  const [testStudent] = await tx
    .insert(students)
    .values({
      parentId: testParent.id,
      userId: testStudentUser.id,
      name: `${suffix} Student`,
      status: "REGULAR",
      classesTotal,
      classesRemaining: classesTotal,
      idempotencyKey: `student-${Date.now()}-${suffix.replace(/\s+/g, "-")}`,
      ...getCommonDates(),
    })
    .returning();
  return { testStudent };
}

async function setupInvoiceTest(tx: DBTransaction, suffix: string) {
  const { testParent } = await setupBaseTest(tx, suffix);
  const [testInvoice] = await tx
    .insert(invoices)
    .values({
      parentId: testParent.id,
      issueDate: "2024-01-01",
      dueDate: "2024-01-31",
      amount: "100.00",
      currency: CurrencyCode.USD,
      status: "UNPAID",
      invoiceType: "MONTHLY",
      idempotencyKey: `invoice-${Date.now()}-${suffix.replace(/\s+/g, "-")}`,
      ...getCommonDates(),
    })
    .returning();
  return { testInvoice };
}

async function expectRepositoryError(fn: () => Promise<unknown>, expectedError: string) {
  try {
    await fn();
    throw new Error(`Expected error "${expectedError}" but none was thrown`);
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    if (error instanceof Error) {
      expect(error.message).toContain(expectedError);
      testLogger.info(`Caught expected error: ${error.message}`);
    }
  }
}

/**
 * Runs `fn` inside a PostgreSQL SAVEPOINT so that a constraint violation
 * (e.g. a CHECK constraint failure) does not poison the outer transaction.
 * After the error, `ROLLBACK TO SAVEPOINT` restores the transaction to a
 * usable state so subsequent queries in the test can run safely.
 */
async function expectSavepointError(
  fn: () => Promise<unknown>,
  tx: DBTransaction,
  expectedError: string
): Promise<void> {
  const sp = `sp_${randomUUID().replaceAll("-", "_")}`;
  await executeTxSql(tx, sql.raw(`SAVEPOINT ${sp}`));
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  if (errorCaught) {
    await executeTxSql(tx, sql.raw(`ROLLBACK TO SAVEPOINT ${sp}`));
  } else {
    await executeTxSql(tx, sql.raw(`RELEASE SAVEPOINT ${sp}`));
  }
  expect(errorCaught).not.toBeNull();
  expect(errorCaught).toBeInstanceOf(Error);
  if (errorCaught instanceof Error) {
    expect(errorCaught.message).toContain(expectedError);
    testLogger.info(`Caught expected error: ${errorCaught.message}`);
  }
}

async function verifyOptimisticLock(
  initialVersion: number,
  firstUpdate: () => Promise<unknown>,
  secondUpdate: () => Promise<unknown>,
  verifyState: () => Promise<void>
) {
  testLogger.info(`Initial version: ${initialVersion}`);

  // First update succeeds
  await firstUpdate();

  // Second update with stale version should fail
  await expectRepositoryError(secondUpdate, "version mismatch");

  // Verify final state
  await verifyState();
}

describe("Concurrency Control Tests", () => {
  describe("Student Classes Remaining - Concurrency Control", () => {
    it("should correctly handle multiple sequential class bookings", async () => {
      await runInRollback(async tx => {
        // Setup: Create test user, parent, and student
        const { testStudent } = await setupStudentTest(tx, "Concurrency Test");

        testLogger.info(`Created student with ID: ${testStudent.id}, classesRemaining: 10`);

        // Execute multiple deductions sequentially (simulating what would happen with optimistic locking)
        await StudentRepository.deductClasses(testStudent.id, tErrors, 1, undefined, tx);
        await StudentRepository.deductClasses(testStudent.id, tErrors, 1, undefined, tx);
        await StudentRepository.deductClasses(testStudent.id, tErrors, 1, undefined, tx);

        // Verify final state
        const [updatedStudent] = await tx.select().from(students).where(eq(students.id, testStudent.id));

        testLogger.info(`Final classesRemaining: ${updatedStudent.classesRemaining}`);

        // Should be 7 (10 - 3), not affected by race conditions
        expect(updatedStudent.classesRemaining).toBe(7);
        expect(updatedStudent.version).toBe(3); // Version incremented 3 times
      });
    });

    it("should handle sequential booking and refund operations correctly", async () => {
      await runInRollback(async tx => {
        // Setup
        const { testStudent } = await setupStudentTest(tx, "Booking Refund Test");

        testLogger.info(`Initial classesRemaining: 10`);

        // Execute operations sequentially (2 bookings and 1 refund)
        await StudentRepository.deductClasses(testStudent.id, tErrors, 1, undefined, tx);
        await StudentRepository.deductClasses(testStudent.id, tErrors, 1, undefined, tx);
        await StudentRepository.addClasses(testStudent.id, tErrors, 5, undefined, tx);

        const [updatedStudent] = await tx.select().from(students).where(eq(students.id, testStudent.id));

        testLogger.info(`Final classesRemaining: ${updatedStudent.classesRemaining}`);

        // Should be 13 (10 - 1 - 1 + 5)
        expect(updatedStudent.classesRemaining).toBe(13);
        expect(updatedStudent.classesTotal).toBe(15); // 10 + 5 from addClasses
      });
    });

    it("should enforce optimistic locking with version mismatch", async () => {
      await runInRollback(async tx => {
        // Setup
        const { testStudent } = await setupStudentTest(tx, "Optimistic Lock Test");

        await verifyOptimisticLock(
          testStudent.version,
          () => StudentRepository.deductClasses(testStudent.id, tErrors, 1, testStudent.version, tx),
          () => StudentRepository.deductClasses(testStudent.id, tErrors, 1, testStudent.version, tx),
          async () => {
            const [finalStudent] = await tx.select().from(students).where(eq(students.id, testStudent.id));
            expect(finalStudent.classesRemaining).toBe(9); // Only one deduction succeeded
            expect(finalStudent.version).toBe(1);
          }
        );
      });
    });

    it("should prevent booking when insufficient classes available (DB CHECK constraint)", async () => {
      await runInRollback(async tx => {
        // Setup
        const { testStudent } = await setupStudentTest(tx, "Insufficient Classes Test", 2);

        testLogger.info(`Initial classesRemaining: 2`);

        // Try to deduct 3 classes via the repo layer. The business-logic
        // check was moved to the service layer (CreditService), so the repo
        // no longer guards against over-deduction. The DB CHECK constraint
        // (students_classes_remaining_chk: classes_remaining >= 0) is the
        // safety net — it rejects the UPDATE because 2 - 3 = -1.
        // Drizzle wraps the constraint violation in a "Failed query" error.
        //
        // We use a SAVEPOINT so the outer transaction stays usable after the
        // constraint violation — without it, PostgreSQL aborts the entire
        // transaction and subsequent queries fail with 25P02.
        await expectSavepointError(
          () => StudentRepository.deductClasses(testStudent.id, tErrors, 3, undefined, tx),
          tx,
          "Failed query"
        );

        // Verify state unchanged (the UPDATE was rolled back to the savepoint)
        const [finalStudent] = await tx.select().from(students).where(eq(students.id, testStudent.id));
        expect(finalStudent.classesRemaining).toBe(2);
        expect(finalStudent.version).toBe(0);
      });
    });
  });

  describe("Invoice Payment - Concurrency Control", () => {
    it("should prevent race conditions when updating invoice status", async () => {
      await runInRollback(async tx => {
        // Setup
        const { testInvoice } = await setupInvoiceTest(tx, "Invoice Concurrency Test");

        testLogger.info(`Created invoice with ID: ${testInvoice.id}, status: UNPAID`);

        // Update status to PAID
        const updatedInvoice = await BillingRepository.updateInvoiceStatus(
          testInvoice.id,
          "PAID",
          tErrors,
          new Date(),
          undefined,
          tx
        );

        testLogger.info(`Updated invoice status to: ${updatedInvoice.status}`);

        expect(updatedInvoice.status).toBe("PAID");
        expect(updatedInvoice.paidDate).not.toBeNull();
        expect(updatedInvoice.version).toBe(1);
      });
    });

    it("should enforce optimistic locking on invoice updates", async () => {
      await runInRollback(async tx => {
        // Setup
        const { testInvoice } = await setupInvoiceTest(tx, "Invoice Optimistic Test");

        await verifyOptimisticLock(
          testInvoice.version,
          () =>
            BillingRepository.updateInvoiceStatus(testInvoice.id, "PAID", tErrors, new Date(), testInvoice.version, tx),
          () =>
            BillingRepository.updateInvoiceStatus(testInvoice.id, "OVERDUE", tErrors, null, testInvoice.version, tx),
          async () => {
            const [finalInvoice] = await tx.select().from(invoices).where(eq(invoices.id, testInvoice.id));
            expect(finalInvoice.status).toBe("PAID"); // Only first update succeeded
            expect(finalInvoice.version).toBe(1);
          }
        );
      });
    });
  });
});
