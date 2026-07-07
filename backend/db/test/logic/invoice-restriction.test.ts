import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { testLogger } from "@/shared/lib/testlogger";
import type { InvoiceInsertType } from "../../../types";
import { invoices, parents, students, users } from "../../schema";
import { runInRollback } from "../test-utils";

describe("Invoice Referential Integrity", () => {
  test("Deleting a student with associated invoices is blocked by restrict constraint", async () => {
    testLogger.info("Starting invoice referential constraint test...");
    await runInRollback(async tx => {
      const now = new Date();
      const uniqueSuffix = randomUUID();

      // 1. Create parent user and parent record
      const parentEmail = `parent-${uniqueSuffix}@example.com`;
      const [parentUser] = await tx
        .insert(users)
        .values({
          name: "Invoice Test Parent",
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
          name: "Invoice Test Student",
          status: "REGULAR",
          idempotencyKey: `stud-${uniqueSuffix}`,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // 3. Create invoice record referencing both parent and student
      const invoiceInput: InvoiceInsertType = {
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
      expect(invoiceRecord).toBeDefined();

      // 4. Attempt to delete student (should fail due to restrict constraint on invoice)
      let didThrow = false;
      try {
        await tx.delete(students).where(sql`id = ${studentRecord.id}`);
      } catch (error) {
        didThrow = true;
        testLogger.info(`Caught expected error: ${error}`);
        // The delete failed, which is what we expect - the foreign key constraint is working
      }
      expect(didThrow).toBe(true);

      testLogger.info("Successfully verified restrict constraint on student deletion.");
    });
  });
});
