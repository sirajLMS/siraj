import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import { db } from "../drizzleDb";
import { BillingRepository, StudentRepository } from "../repo";
import { invoices, parents, students, users } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  try {
    await db.transaction(async tx => {
      await fn(tx);
      throw new Error("ROLLBACK");
    });
  } catch (error) {
    if (error instanceof Error && error.message !== "ROLLBACK") {
      throw error;
    }
  }
}

describe("Concurrency Control Tests", () => {
  describe("Student Classes Remaining - Concurrency Control", () => {
    it("should correctly handle multiple sequential class bookings", async () => {
      await runInRollback(async tx => {
        // Setup: Create test user, parent, and student
        const [testUser] = await tx
          .insert(users)
          .values({
            name: "Concurrency Test User",
            email: "concurrency-test@example.com",
            password: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testParent] = await tx
          .insert(parents)
          .values({
            userId: testUser.id,
            status: "REGULAR",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testStudent] = await tx
          .insert(students)
          .values({
            parentId: testParent.id,
            name: "Concurrency Test Student",
            status: "REGULAR",
            classesTotal: 10,
            classesRemaining: 10,
            idempotencyKey: `student-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        testLogger.info(`Created student with ID: ${testStudent.id}, classesRemaining: 10`);

        // Execute multiple deductions sequentially (simulating what would happen with optimistic locking)
        await StudentRepository.deductClasses(testStudent.id, 1, undefined, tx);
        await StudentRepository.deductClasses(testStudent.id, 1, undefined, tx);
        await StudentRepository.deductClasses(testStudent.id, 1, undefined, tx);

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
        const [testUser] = await tx
          .insert(users)
          .values({
            name: "Booking Refund Test User",
            email: "booking-refund-test@example.com",
            password: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testParent] = await tx
          .insert(parents)
          .values({
            userId: testUser.id,
            status: "REGULAR",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testStudent] = await tx
          .insert(students)
          .values({
            parentId: testParent.id,
            name: "Booking Refund Test",
            status: "REGULAR",
            classesTotal: 10,
            classesRemaining: 10,
            idempotencyKey: `student-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        testLogger.info(`Initial classesRemaining: 10`);

        // Execute operations sequentially (2 bookings and 1 refund)
        await StudentRepository.deductClasses(testStudent.id, 1, undefined, tx);
        await StudentRepository.deductClasses(testStudent.id, 1, undefined, tx);
        await StudentRepository.addClasses(testStudent.id, 5, undefined, tx);

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
        const [testUser] = await tx
          .insert(users)
          .values({
            name: "Optimistic Lock Test User",
            email: "optimistic-lock-test@example.com",
            password: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testParent] = await tx
          .insert(parents)
          .values({
            userId: testUser.id,
            status: "REGULAR",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testStudent] = await tx
          .insert(students)
          .values({
            parentId: testParent.id,
            name: "Optimistic Lock Test",
            status: "REGULAR",
            classesTotal: 10,
            classesRemaining: 10,
            idempotencyKey: `student-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const initialVersion = testStudent.version;
        testLogger.info(`Initial version: ${initialVersion}`);

        // First update succeeds
        await StudentRepository.deductClasses(testStudent.id, 1, initialVersion, tx);

        // Second update with stale version should fail
        try {
          await StudentRepository.deductClasses(testStudent.id, 1, initialVersion, tx);
          throw new Error("Should have thrown version mismatch error");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          if (error instanceof Error) {
            expect(error.message).toContain("Version mismatch");
            testLogger.info(`Correctly caught version mismatch: ${error.message}`);
          }
        }

        // Verify state
        const [finalStudent] = await tx.select().from(students).where(eq(students.id, testStudent.id));
        expect(finalStudent.classesRemaining).toBe(9); // Only one deduction succeeded
        expect(finalStudent.version).toBe(1);
      });
    });

    it("should prevent booking when insufficient classes available", async () => {
      await runInRollback(async tx => {
        // Setup
        const [testUser] = await tx
          .insert(users)
          .values({
            name: "Insufficient Classes Test User",
            email: "insufficient-classes-test@example.com",
            password: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testParent] = await tx
          .insert(parents)
          .values({
            userId: testUser.id,
            status: "REGULAR",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testStudent] = await tx
          .insert(students)
          .values({
            parentId: testParent.id,
            name: "Insufficient Classes Test",
            status: "REGULAR",
            classesTotal: 2,
            classesRemaining: 2,
            idempotencyKey: `student-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        testLogger.info(`Initial classesRemaining: 2`);

        // Try to deduct 3 classes (should fail)
        try {
          await StudentRepository.deductClasses(testStudent.id, 3, undefined, tx);
          throw new Error("Should have thrown insufficient classes error");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          if (error instanceof Error) {
            expect(error.message).toContain("Insufficient classes");
            testLogger.info(`Correctly prevented over-booking: ${error.message}`);
          }
        }

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
        const [testUser] = await tx
          .insert(users)
          .values({
            name: "Invoice Concurrency Test User",
            email: "invoice-concurrency-test@example.com",
            password: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testParent] = await tx
          .insert(parents)
          .values({
            userId: testUser.id,
            status: "REGULAR",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testInvoice] = await tx
          .insert(invoices)
          .values({
            parentId: testParent.id,
            issueDate: "2024-01-01",
            dueDate: "2024-01-31",
            amount: "100.00",
            currency: "USD",
            status: "UNPAID",
            invoiceType: "MONTHLY",
            idempotencyKey: `invoice-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        testLogger.info(`Created invoice with ID: ${testInvoice.id}, status: UNPAID`);

        // Update status to PAID
        const updatedInvoice = await BillingRepository.updateInvoiceStatus(
          testInvoice.id,
          "PAID",
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
        const [testUser] = await tx
          .insert(users)
          .values({
            name: "Invoice Optimistic Test User",
            email: "invoice-optimistic-test@example.com",
            password: "hash",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testParent] = await tx
          .insert(parents)
          .values({
            userId: testUser.id,
            status: "REGULAR",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const [testInvoice] = await tx
          .insert(invoices)
          .values({
            parentId: testParent.id,
            issueDate: "2024-01-01",
            dueDate: "2024-01-31",
            amount: "100.00",
            currency: "USD",
            status: "UNPAID",
            invoiceType: "MONTHLY",
            idempotencyKey: `invoice-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        const initialVersion = testInvoice.version;
        testLogger.info(`Initial version: ${initialVersion}`);

        // First update succeeds
        await BillingRepository.updateInvoiceStatus(testInvoice.id, "PAID", new Date(), initialVersion, tx);

        // Second update with stale version should fail
        try {
          await BillingRepository.updateInvoiceStatus(testInvoice.id, "OVERDUE", null, initialVersion, tx);
          throw new Error("Should have thrown version mismatch error");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          if (error instanceof Error) {
            expect(error.message).toContain("Version mismatch");
            testLogger.info(`Correctly caught version mismatch: ${error.message}`);
          }
        }

        // Verify state
        const [finalInvoice] = await tx.select().from(invoices).where(eq(invoices.id, testInvoice.id));
        expect(finalInvoice.status).toBe("PAID"); // Only first update succeeded
        expect(finalInvoice.version).toBe(1);
      });
    });
  });
});
