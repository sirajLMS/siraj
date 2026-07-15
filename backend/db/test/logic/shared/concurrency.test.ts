import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { BillingRepository, StudentRepository } from "@/backend/db/repo";
import { invoices, parents, students, users } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode } from "@/backend/enum";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

let tErrors: ErrorsLabels;
beforeAll(async () => {
  tErrors = await getServerTranslations("en", "errors");
});

const getCommonDates = () => ({ createdAt: new Date(), updatedAt: new Date() });

async function setupBaseTest(tx: DBTransaction, suffix: string) {
  const [testUser] = await tx
    .insert(users)
    .values({
      name: `${suffix} User`,
      email: `${suffix.toLowerCase().replace(/\s+/g, "-")}-test@example.com`,
      password: "hash",
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
      password: "hash",
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
        await StudentRepository.deductClasses(testStudent.id, 1, tErrors, undefined, tx);
        await StudentRepository.deductClasses(testStudent.id, 1, tErrors, undefined, tx);
        await StudentRepository.deductClasses(testStudent.id, 1, tErrors, undefined, tx);

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
        await StudentRepository.deductClasses(testStudent.id, 1, tErrors, undefined, tx);
        await StudentRepository.deductClasses(testStudent.id, 1, tErrors, undefined, tx);
        await StudentRepository.addClasses(testStudent.id, 5, tErrors, undefined, tx);

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
          () => StudentRepository.deductClasses(testStudent.id, 1, tErrors, testStudent.version, tx),
          () => StudentRepository.deductClasses(testStudent.id, 1, tErrors, testStudent.version, tx),
          async () => {
            const [finalStudent] = await tx.select().from(students).where(eq(students.id, testStudent.id));
            expect(finalStudent.classesRemaining).toBe(9); // Only one deduction succeeded
            expect(finalStudent.version).toBe(1);
          }
        );
      });
    });

    it("should prevent booking when insufficient classes available", async () => {
      await runInRollback(async tx => {
        // Setup
        const { testStudent } = await setupStudentTest(tx, "Insufficient Classes Test", 2);

        testLogger.info(`Initial classesRemaining: 2`);

        // Try to deduct 3 classes (should fail)
        await expectRepositoryError(
          () => StudentRepository.deductClasses(testStudent.id, 3, tErrors, undefined, tx),
          "Insufficient class balance"
        );

        // Verify state unchanged
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
