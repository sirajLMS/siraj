// cspell:ignore idemp

import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { testLogger } from "../../../lib/testlogger";
import type { InvoiceInsertInput, PaymentInsertInput } from "../../types";
import { db } from "../drizzleDb";
import { invoices, parents, payments, students, users } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

describe("Payment Idempotency", () => {
  test("Unique idempotency key constraint blocks duplicate payment records", async () => {
    testLogger.info("Starting payment idempotency constraint test...");
    await runInRollback(async tx => {
      const now = new Date();
      const uniqueSuffix = randomUUID();

      // 1. Create parent user and parent record
      const parentEmail = `parent-${uniqueSuffix}@example.com`;
      const [parentUser] = await tx
        .insert(users)
        .values({
          name: "Idempotency Test Parent",
          email: parentEmail,
          password: "securePassword",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const [parentRecord] = await tx
        .insert(parents)
        .values({
          userId: parentUser.id,
          status: "REGULAR",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // 2. Create student record
      const [studentRecord] = await tx
        .insert(students)
        .values({
          parentId: parentRecord.id,
          name: "Idempotency Test Student",
          status: "REGULAR",
          idempotencyKey: `stud-${uniqueSuffix}`,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // 3. Create invoice record
      const invoiceInput: InvoiceInsertInput = {
        parentId: parentRecord.id,
        studentId: studentRecord.id,
        issueDate: "2026-06-09",
        dueDate: "2026-06-16",
        amount: "100.00",
        currency: "USD",
        status: "UNPAID",
        invoiceType: "PER_CLASSES",
        idempotencyKey: `inv-${uniqueSuffix}`,
        createdAt: now,
        updatedAt: now,
      };
      const [invoiceRecord] = await tx.insert(invoices).values(invoiceInput).returning();

      // 4. Insert first payment record
      const idempotencyKey = `idemp-${uniqueSuffix}`;
      const paymentInput1: PaymentInsertInput = {
        invoiceId: invoiceRecord.id,
        amount: "100.00",
        currency: "USD",
        paymentDate: now,
        paymentMethod: "PAYPAL",
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      };
      const [payment1] = await tx.insert(payments).values(paymentInput1).returning();
      expect(payment1).toBeDefined();

      // 5. Insert second payment record with the same idempotency key (should fail)
      const paymentInput2: PaymentInsertInput = {
        invoiceId: invoiceRecord.id,
        amount: "100.00",
        currency: "USD",
        paymentDate: now,
        paymentMethod: "PAYPAL",
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      };

      let didThrow = false;
      try {
        await tx.insert(payments).values(paymentInput2);
      } catch (error) {
        didThrow = true;
        testLogger.info(`Caught expected error: ${error}`);
        // The insert failed, which is what we expect - the unique constraint is working
      }
      expect(didThrow).toBe(true);

      testLogger.info("Successfully verified payment idempotency key unique constraint.");
    });
  });
});
