import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { CreditRepository } from "@/backend/db/repo";
import { creditTransactions, invoices, payments, students } from "@/backend/db/schema";
import {
  createTestCreditTransaction,
  createTestUser,
  setupStudent,
  setupTeacher,
  setupTestEntities,
} from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CreditReason, CurrencyCode, PaymentMethodType } from "@/backend/enum";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import type { ClassInstanceEntity, InvoiceInsertType, PaymentInsertType } from "@/backend/types";
import { PaginationArgs } from "@/backend/types";
import type { PaymentMethodTransactionSnapshot } from "@/backend/types/billing/payment-method.types";

/**
 * Resolves the nullable `instance` returned from `setupTestEntities` to a
 * concrete `ClassInstanceEntity`. Tests pass `{ skipInstance: false }` so an
 * instance is always created; this helper keeps the call sites concise while
 * satisfying TypeScript's strict null checks.
 */
function requireInstance(instance: ClassInstanceEntity | null): ClassInstanceEntity {
  if (!instance) {
    throw new Error("setupTestEntities returned a null instance — pass skipInstance:false");
  }
  return instance;
}

/**
 * Inserts an invoice + payment row for the given parent/student and returns
 * the new payment id. Required because `credit_transactions.source_payment_id`
 * has an FK to `payments.id` — passing a random UUID triggers an FK violation.
 */
async function createTestPayment(tx: DBTransaction, parentId: string, studentId: string): Promise<string> {
  const now = new Date();
  const invoiceInput: InvoiceInsertType = {
    parentId,
    studentId,
    issueDate: "2026-06-09",
    dueDate: "2026-06-16",
    amount: "100.00",
    currency: CurrencyCode.USD,
    status: "PAID",
    invoiceType: "PER_CLASSES",
    idempotencyKey: `inv-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  };
  const [invoice] = await tx.insert(invoices).values(invoiceInput).returning();

  const snapshot: PaymentMethodTransactionSnapshot = {
    userPaymentMethodId: null,
    type: PaymentMethodType.CASH,
    direction: PaymentDirection.PAYIN,
    label: "Cash payment",
    details: { note: "Test cash payment for credit purchase" },
    catalog: null,
    snapshottedAt: now.toISOString(),
  };
  const paymentInput: PaymentInsertType = {
    invoiceId: invoice.id,
    amount: "100.00",
    currency: CurrencyCode.USD,
    paymentDate: now,
    paymentMethodType: PaymentMethodType.CASH,
    paymentMethodSnapshot: snapshot,
    idempotencyKey: `pay-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  };
  const [payment] = await tx.insert(payments).values(paymentInput).returning();
  return payment.id;
}

/**
 * Runs `fn` inside a PostgreSQL SAVEPOINT so that a constraint violation
 * (e.g. a duplicate idempotency key rejected by a unique index) can be caught
 * WITHOUT poisoning the outer `runInRollback` transaction. After catching,
 * issues `ROLLBACK TO SAVEPOINT` to restore the transaction to a usable state
 * so subsequent queries can run.
 */
async function expectSavepointError(fn: () => Promise<unknown>, tx: DBTransaction): Promise<Error> {
  const sp = `sp_${randomUUID().replaceAll("-", "_")}`;
  await tx.execute(sql.raw(`SAVEPOINT ${sp}`));
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  if (errorCaught) {
    await tx.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${sp}`));
  } else {
    await tx.execute(sql.raw(`RELEASE SAVEPOINT ${sp}`));
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

describe("CreditRepository.getBalance", () => {
  test("returns the student's classesTotal and classesRemaining", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, {}, {}, { classesTotal: 12, classesRemaining: 8 });

      const balance = await CreditRepository.getBalance(tx, student.id);

      expect(balance.classesTotal).toBe(12);
      expect(balance.classesRemaining).toBe(8);
    });
  });

  test("returns zero values for a non-existent student", async () => {
    await runInRollback(async tx => {
      const balance = await CreditRepository.getBalance(tx, randomUUID());

      expect(balance.classesTotal).toBe(0);
      expect(balance.classesRemaining).toBe(0);
    });
  });

  test("accepts the global db connection as the executor", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, {}, {}, { classesTotal: 5, classesRemaining: 3 });

      const balance = await CreditRepository.getBalance(tx, student.id);

      expect(balance.classesTotal).toBe(5);
      expect(balance.classesRemaining).toBe(3);
    });
  });
});

describe("CreditRepository.getTransactions", () => {
  test("returns transactions for a student ordered by createdAt DESC", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, {}, {}, { classesTotal: 10, classesRemaining: 10 });
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });

      const first = await createTestCreditTransaction(tx, student.id, adminUser.id, {
        changeAmount: 5,
        reason: CreditReason.PURCHASE,
      });
      await new Promise(r => setTimeout(r, 5));
      const second = await createTestCreditTransaction(tx, student.id, adminUser.id, {
        changeAmount: -1,
        reason: CreditReason.DEDUCTION,
      });

      const rows = await CreditRepository.getTransactions(tx, student.id);

      expect(rows).toHaveLength(2);
      expect(rows[0]?.id).toBe(second.id);
      expect(rows[1]?.id).toBe(first.id);
    });
  });

  test("returns paginated transactions when PaginationArgs is supplied", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, {}, {}, { classesTotal: 10, classesRemaining: 10 });
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });

      for (let i = 0; i < 3; i++) {
        await createTestCreditTransaction(tx, student.id, adminUser.id, {
          changeAmount: 1,
          reason: CreditReason.PURCHASE,
        });
        await new Promise(r => setTimeout(r, 5));
      }

      const pagination = new PaginationArgs({ first: 2, page: 1 });
      const rows = await CreditRepository.getTransactions(tx, student.id, pagination);

      expect(rows).toHaveLength(2);
      const allRows = await tx
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.studentId, student.id))
        .orderBy(creditTransactions.createdAt);
      expect(rows[0]?.id).toBe(allRows[2]?.id);
      expect(rows[1]?.id).toBe(allRows[1]?.id);
    });
  });

  test("returns empty list when the student has no transactions", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);
      const rows = await CreditRepository.getTransactions(tx, student.id);
      expect(rows).toEqual([]);
    });
  });
});

describe("CreditRepository.countTransactions", () => {
  test("counts transactions for a student", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, {}, {}, { classesTotal: 10, classesRemaining: 10 });
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });

      const initialCount = await CreditRepository.countTransactions(tx, student.id);

      await createTestCreditTransaction(tx, student.id, adminUser.id);
      await createTestCreditTransaction(tx, student.id, adminUser.id);

      const newCount = await CreditRepository.countTransactions(tx, student.id);

      expect(newCount).toBe(initialCount + 2);
    });
  });
});

describe("CreditRepository.createPurchase", () => {
  test("creates a ledger row with reason PURCHASE and the supplied changeAmount", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, {}, {}, { classesTotal: 0, classesRemaining: 0 });
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });
      const idempotencyKey = randomUUID();

      const row = await CreditRepository.createPurchase(tx, {
        studentId: student.id,
        changeAmount: 10,
        creditedByUserId: adminUser.id,
        idempotencyKey,
        notes: "Test purchase",
      });

      expect(row.studentId).toBe(student.id);
      expect(row.changeAmount).toBe(10);
      expect(row.reason).toBe(CreditReason.PURCHASE);
      expect(row.idempotencyKey).toBe(idempotencyKey);
      expect(row.creditedByUserId).toBe(adminUser.id);
      expect(row.notes).toBe("Test purchase");
      expect(row.classInstanceId).toBeNull();
    });
  });

  test("stores sourcePaymentId and null notes when supplied", async () => {
    await runInRollback(async tx => {
      const { user, parent, student } = await setupStudent(tx, {}, {}, { classesTotal: 0, classesRemaining: 0 });
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });
      // source_payment_id FK references payments.id — must insert a real row.
      const paymentId = await createTestPayment(tx, parent.id, student.id);

      const row = await CreditRepository.createPurchase(tx, {
        studentId: student.id,
        changeAmount: 4,
        creditedByUserId: adminUser.id,
        idempotencyKey: randomUUID(),
        sourcePaymentId: paymentId,
      });

      expect(row.sourcePaymentId).toBe(paymentId);
      expect(row.notes).toBeNull();
      expect(user.id).toBeDefined();
    });
  });
});

describe("CreditRepository.deductForBooking", () => {
  test("creates a ledger row with reason DEDUCTION and negative changeAmount", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "DeductBooking");
      const instance = requireInstance(entities.instance);
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });

      const row = await CreditRepository.deductForBooking(tx, {
        studentId: entities.student.id,
        classInstanceId: instance.id,
        creditedByUserId: adminUser.id,
        idempotencyKey: randomUUID(),
      });

      expect(row.studentId).toBe(entities.student.id);
      expect(row.changeAmount).toBe(-1);
      expect(row.reason).toBe(CreditReason.DEDUCTION);
      expect(row.classInstanceId).toBe(instance.id);
      expect(row.creditedByUserId).toBe(adminUser.id);
      expect(entities.teacher.id).toBeDefined();
    });
  });
});

describe("CreditRepository.refundOnCancel", () => {
  test("creates a ledger row with reason REFUND and positive changeAmount", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "RefundCancel");
      const instance = requireInstance(entities.instance);
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });

      const row = await CreditRepository.refundOnCancel(tx, {
        studentId: entities.student.id,
        classInstanceId: instance.id,
        creditedByUserId: adminUser.id,
        idempotencyKey: randomUUID(),
      });

      expect(row.studentId).toBe(entities.student.id);
      expect(row.changeAmount).toBe(1);
      expect(row.reason).toBe(CreditReason.REFUND);
      expect(row.classInstanceId).toBe(instance.id);
      expect(row.creditedByUserId).toBe(adminUser.id);
    });
  });
});

describe("CreditRepository.findByIdempotencyKeys", () => {
  test("finds existing rows by their idempotency keys", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, {}, {}, { classesTotal: 10, classesRemaining: 10 });
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });
      const keyA = randomUUID();
      const keyB = randomUUID();

      const rowA = await createTestCreditTransaction(tx, student.id, adminUser.id, {
        idempotencyKey: keyA,
      });
      const rowB = await createTestCreditTransaction(tx, student.id, adminUser.id, {
        idempotencyKey: keyB,
      });

      const found = await CreditRepository.findByIdempotencyKeys([keyA, keyB], tx);

      expect(found).toHaveLength(2);
      const foundIds = found.map(r => r.id);
      expect(foundIds).toContain(rowA.id);
      expect(foundIds).toContain(rowB.id);
    });
  });

  test("returns empty array for non-existent keys", async () => {
    await runInRollback(async tx => {
      const found = await CreditRepository.findByIdempotencyKeys([randomUUID(), randomUUID()], tx);
      expect(found).toEqual([]);
    });
  });

  test("returns empty array when keys list is empty", async () => {
    await runInRollback(async tx => {
      const found = await CreditRepository.findByIdempotencyKeys([], tx);
      expect(found).toEqual([]);
    });
  });
});

describe("CreditRepository.deductForBooking — idempotency", () => {
  test("calling deductForBooking with the same idempotencyKey twice does not duplicate the row", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "Idempotency");
      const instance = requireInstance(entities.instance);
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });
      const idempotencyKey = randomUUID();

      await CreditRepository.deductForBooking(tx, {
        studentId: entities.student.id,
        classInstanceId: instance.id,
        creditedByUserId: adminUser.id,
        idempotencyKey,
      });

      // The second insert is rejected by the unique idempotency-key index; wrap
      // it in a SAVEPOINT so the outer rollback transaction is not poisoned
      // (otherwise subsequent queries fail with 25P02 "current transaction is
      // aborted"). After the SAVEPOINT rollback, the SELECT below runs safely.
      const error = await expectSavepointError(
        () =>
          CreditRepository.deductForBooking(tx, {
            studentId: entities.student.id,
            classInstanceId: instance.id,
            creditedByUserId: adminUser.id,
            idempotencyKey,
          }),
        tx
      );
      expect(error).toBeDefined();

      const rows = await tx
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.idempotencyKey, idempotencyKey));
      expect(rows).toHaveLength(1);
    });
  });
});

describe("CreditRepository.findByClassInstanceId", () => {
  test("returns ledger rows linked to a class instance", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "FindByClass");
      const instance = requireInstance(entities.instance);
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });

      await createTestCreditTransaction(tx, entities.student.id, adminUser.id, {
        classInstanceId: instance.id,
        reason: CreditReason.DEDUCTION,
        changeAmount: -1,
      });

      const rows = await CreditRepository.findByClassInstanceId(tx, instance.id);

      expect(rows).toHaveLength(1);
      expect(rows[0]?.classInstanceId).toBe(instance.id);
    });
  });

  test("filters by reason when supplied", async () => {
    await runInRollback(async tx => {
      const entities = await setupTestEntities(tx, "FindByClassReason");
      const instance = requireInstance(entities.instance);
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });

      await createTestCreditTransaction(tx, entities.student.id, adminUser.id, {
        classInstanceId: instance.id,
        reason: CreditReason.DEDUCTION,
        changeAmount: -1,
      });
      await createTestCreditTransaction(tx, entities.student.id, adminUser.id, {
        classInstanceId: instance.id,
        reason: CreditReason.REFUND,
        changeAmount: 1,
      });

      const deductions = await CreditRepository.findByClassInstanceId(tx, instance.id, CreditReason.DEDUCTION);
      const refunds = await CreditRepository.findByClassInstanceId(tx, instance.id, CreditReason.REFUND);

      expect(deductions).toHaveLength(1);
      expect(deductions[0]?.reason).toBe(CreditReason.DEDUCTION);
      expect(refunds).toHaveLength(1);
      expect(refunds[0]?.reason).toBe(CreditReason.REFUND);
    });
  });
});

describe("CreditRepository.aggregateBalanceFromLedger", () => {
  test("sums classesTotal from PURCHASE rows and classesRemaining from all rows", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, {}, {}, { classesTotal: 0, classesRemaining: 0 });
      const adminUser = await createTestUser(tx, { name: "Credit Admin" });

      await createTestCreditTransaction(tx, student.id, adminUser.id, {
        changeAmount: 10,
        reason: CreditReason.PURCHASE,
      });
      await createTestCreditTransaction(tx, student.id, adminUser.id, {
        changeAmount: -1,
        reason: CreditReason.DEDUCTION,
      });
      await createTestCreditTransaction(tx, student.id, adminUser.id, {
        changeAmount: 1,
        reason: CreditReason.REFUND,
      });

      const balance = await CreditRepository.aggregateBalanceFromLedger(tx, student.id);

      expect(balance.classesTotal).toBe(10);
      expect(balance.classesRemaining).toBe(10);
    });
  });

  test("returns zeros when no transactions exist", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx, {}, {}, { classesTotal: 0, classesRemaining: 0 });
      const balance = await CreditRepository.aggregateBalanceFromLedger(tx, student.id);
      expect(balance.classesTotal).toBe(0);
      expect(balance.classesRemaining).toBe(0);
    });
  });
});

describe("CreditRepository.generateIdempotencyKey", () => {
  test("produces a deterministic key combining studentId, hours and notes", () => {
    const key = CreditRepository.generateIdempotencyKey({
      studentId: "abc",
      hours: 5,
      notes: "hello",
    });
    expect(key).toContain("-credit-");

    const duplicate = CreditRepository.generateIdempotencyKey({
      studentId: "abc",
      hours: 5,
      notes: "hello",
    });
    expect(duplicate).toBe(key);
  });

  test("produces distinct keys when inputs differ", () => {
    const keyA = CreditRepository.generateIdempotencyKey({ studentId: "abc", hours: 5 });
    const keyB = CreditRepository.generateIdempotencyKey({ studentId: "abc", hours: 6 });
    expect(keyA).not.toBe(keyB);
  });
});

describe("CreditRepository — tx propagation", () => {
  test("all mutating methods accept and use the supplied transaction", async () => {
    await runInRollback(async tx => {
      const { user: teacherUser, teacher } = await setupTeacher(tx, { name: "Tx Teacher" });
      const { parent, student } = await setupStudent(tx, { name: "Tx Parent" });
      expect(teacher.id).toBeDefined();
      expect(parent.id).toBeDefined();

      const purchase = await CreditRepository.createPurchase(tx, {
        studentId: student.id,
        changeAmount: 10,
        creditedByUserId: teacherUser.id,
        idempotencyKey: randomUUID(),
      });
      const [fetched] = await tx.select().from(creditTransactions).where(eq(creditTransactions.id, purchase.id));
      expect(fetched).toBeDefined();
      expect(fetched?.reason).toBe(CreditReason.PURCHASE);

      const [fetchedStudent] = await tx.select().from(students).where(eq(students.id, student.id));
      expect(fetchedStudent).toBeDefined();
    });
  });
});
