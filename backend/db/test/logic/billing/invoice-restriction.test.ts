import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { invoices, students } from "@/backend/db/schema";
import { createTestParent, createTestUser, setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import type { DBTransaction, InvoiceInsertType } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { testLogger } from "@/shared/lib/logger/testlogger";

async function insertInvoice(
  tx: DBTransaction,
  parentId: string,
  studentId: string,
  uniqueSuffix: string
): Promise<void> {
  const now = new Date();
  const invoiceInput: InvoiceInsertType = {
    parentId,
    studentId,
    issueDate: "2026-06-09",
    dueDate: "2026-06-16",
    amount: "100.00",
    currency: CurrencyCode.USD,
    status: "UNPAID",
    invoiceType: "PER_CLASSES",
    idempotencyKey: `inv-${uniqueSuffix}`,
    createdAt: now,
    updatedAt: now,
  };
  const [invoiceRecord] = await tx.insert(invoices).values(invoiceInput).returning();
  expect(invoiceRecord).toBeDefined();
}

async function expectDeleteBlocked(tx: DBTransaction, studentId: string): Promise<void> {
  let didThrow = false;
  try {
    await tx.delete(students).where(sql`id = ${studentId}`);
  } catch (error) {
    didThrow = true;
    testLogger.info(`Caught expected error: ${String(error)}`);
  }
  expect(didThrow).toBe(true);
}

describe("Invoice Referential Integrity", () => {
  test("Deleting a student with associated invoices is blocked by restrict constraint", async () => {
    testLogger.info("Starting invoice referential constraint test...");
    await runInRollback(async tx => {
      const uniqueSuffix = randomUUID();

      const parentUser = await createTestUser(tx, {
        name: "Invoice Test Parent",
        email: `parent-${uniqueSuffix}@example.com`,
      });
      const parentRecord = await createTestParent(tx, parentUser.id, {
        status: "REGULAR",
      });

      const { student } = await setupStudent(
        tx,
        {
          name: "Invoice Test Student User",
          email: `student-${uniqueSuffix}@example.com`,
        },
        {},
        {
          name: "Invoice Test Student",
          status: "REGULAR",
          idempotencyKey: `stud-${uniqueSuffix}`,
        }
      );

      await insertInvoice(tx, parentRecord.id, student.id, uniqueSuffix);

      await expectDeleteBlocked(tx, student.id);

      testLogger.info("Successfully verified restrict constraint on student deletion.");
    });
  });
});
