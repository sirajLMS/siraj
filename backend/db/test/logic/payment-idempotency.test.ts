// cspell:ignore idemp

import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { testLogger } from "@/shared/lib/testlogger";
import type { InvoiceInsertInput, PaymentInsertInput } from "../../../types";
import { invoices, parents, payments, students, users } from "../../schema";
import { type DbTransaction, runInRollback } from "../test-utils";

async function createTestParent(args: { tx: DbTransaction; suffix: string; now: Date }) {
  const { tx, suffix, now } = args;
  const parentEmail = `parent-${suffix}@example.com`;
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

  return parentRecord;
}

async function createTestStudent(args: { tx: DbTransaction; parentId: string; suffix: string; now: Date }) {
  const { tx, parentId, suffix, now } = args;
  const [studentRecord] = await tx
    .insert(students)
    .values({
      parentId,
      name: "Idempotency Test Student",
      status: "REGULAR",
      idempotencyKey: `stud-${suffix}`,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return studentRecord;
}

async function createTestInvoice(args: {
  tx: DbTransaction;
  parentId: string;
  studentId: string;
  suffix: string;
  now: Date;
}) {
  const { tx, parentId, studentId, suffix, now } = args;
  const invoiceInput: InvoiceInsertInput = {
    parentId,
    studentId,
    issueDate: "2026-06-09",
    dueDate: "2026-06-16",
    amount: "100.00",
    currency: "USD",
    status: "UNPAID",
    invoiceType: "PER_CLASSES",
    idempotencyKey: `inv-${suffix}`,
    createdAt: now,
    updatedAt: now,
  };
  const [invoiceRecord] = await tx.insert(invoices).values(invoiceInput).returning();
  return invoiceRecord;
}

describe("Payment Idempotency", () => {
  test("Unique idempotency key constraint blocks duplicate payment records", async () => {
    testLogger.info("Starting payment idempotency constraint test...");
    await runInRollback(async tx => {
      const now = new Date();
      const uniqueSuffix = randomUUID();

      const parentRecord = await createTestParent({ tx, suffix: uniqueSuffix, now });
      const studentRecord = await createTestStudent({
        tx,
        parentId: parentRecord.id,
        suffix: uniqueSuffix,
        now,
      });
      const invoiceRecord = await createTestInvoice({
        tx,
        parentId: parentRecord.id,
        studentId: studentRecord.id,
        suffix: uniqueSuffix,
        now,
      });

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
