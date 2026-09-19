import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { AccountingPaymentRepository, PackagePlanRepository } from "@/backend/db/repo/billing";
import { invoices, payments, students } from "@/backend/db/schema";
import { createTestUser, setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { PaymentGateway, PaymentMethodType } from "@/backend/enum";
import type { DBTransaction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/** Mid-month noon UTC — the created_at month bucket stays inside the month for any session timezone. */
const monthDate = (month: string, day = 15) => new Date(`${month}-${String(day).padStart(2, "0")}T12:00:00.000Z`);

type IncomeFixture = {
  parentUserName: string;
  studentName: string;
  invoiceId: string;
};

/** Creates the student/parent/package/invoice chain one income payment hangs off. */
async function setupIncomeFixture(tx: DBTransaction): Promise<IncomeFixture> {
  const { user, parent, student } = await setupStudent(
    tx,
    { name: "PL Parent", email: `pl-par-${randomUUID().slice(0, 8)}@example.com` },
    {},
    { name: "PL Student" }
  );
  const now = new Date();
  const [invoice] = await tx
    .insert(invoices)
    .values({
      parentId: parent.id,
      studentId: student.id,
      issueDate: "2030-05-01",
      dueDate: "2030-05-01",
      amount: "100.00",
      currency: CurrencyCode.USD,
      status: "PAID",
      invoiceType: "CREDIT_HOURS_PACKAGE",
      idempotencyKey: `pl-income-inv-${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!invoice) throw new Error("fixture invoice insert returned no rows");

  return { parentUserName: user.name, studentName: student.name, invoiceId: invoice.id };
}

type CreateIncomePaymentArgs = {
  invoiceId: string;
  createdAt: Date;
  currency?: CurrencyCode;
  packagePlanId?: string | null;
};

/**
 * Records an income payment and pins its `created_at` — the repository stamps
 * creation time with the wall clock, and the month filter buckets on it.
 */
async function createIncomePayment(tx: DBTransaction, args: CreateIncomePaymentArgs) {
  const payment = await AccountingPaymentRepository.create(tx, {
    invoiceId: args.invoiceId,
    amount: "100.00",
    currency: args.currency ?? CurrencyCode.USD,
    paymentDate: args.createdAt,
    packagePlanId: args.packagePlanId ?? null,
    paymentGateway: PaymentGateway.BANK,
    creditHours: "10.00",
    isPaidStatusOn: true,
    paymentNote: null,
    idempotencyKey: `pl-income-pay-${randomUUID()}`,
  });
  await tx
    .update(payments)
    .set({ createdAt: args.createdAt, updatedAt: args.createdAt })
    .where(eq(payments.id, payment.id));
  return payment;
}

const queryMonth = (tx: DBTransaction, month: string) =>
  AccountingPaymentRepository.findProfitLossIncome({ month }, { limit: 10_000, offset: 0 }, tx);

describe("AccountingPaymentRepository.findProfitLossIncome", () => {
  test("month filter returns only payments created in the requested month, newest first", async () => {
    await runInRollback(async tx => {
      const { invoiceId } = await setupIncomeFixture(tx);
      const baselineMay = (await queryMonth(tx, "2030-05")).totalCount;
      const baselineApril = (await queryMonth(tx, "2030-04")).totalCount;

      const earlyMay = await createIncomePayment(tx, { invoiceId, createdAt: monthDate("2030-05", 5) });
      const lateMay = await createIncomePayment(tx, { invoiceId, createdAt: monthDate("2030-05", 20) });
      const april = await createIncomePayment(tx, { invoiceId, createdAt: monthDate("2030-04", 10) });

      const may = await queryMonth(tx, "2030-05");
      expect(may.totalCount).toBe(baselineMay + 2);
      const mayIds = may.rows.map(row => row.paymentId);
      expect(mayIds).toContain(earlyMay.id);
      expect(mayIds).toContain(lateMay.id);
      expect(mayIds.indexOf(lateMay.id)).toBeLessThan(mayIds.indexOf(earlyMay.id));
      expect(mayIds).not.toContain(april.id);

      const aprilPage = await queryMonth(tx, "2030-04");
      expect(aprilPage.totalCount).toBe(baselineApril + 1);
      expect(aprilPage.rows.map(row => row.paymentId)).toContain(april.id);
      expect(aprilPage.rows.map(row => row.paymentId)).not.toContain(earlyMay.id);
    });
  });

  test("pagination slices the month while totalCount covers the full month", async () => {
    await runInRollback(async tx => {
      const { invoiceId } = await setupIncomeFixture(tx);
      const baseline = (await queryMonth(tx, "2031-03")).totalCount;
      const fullCount = baseline + 3;

      const first = await createIncomePayment(tx, { invoiceId, createdAt: monthDate("2031-03", 5) });
      const second = await createIncomePayment(tx, { invoiceId, createdAt: monthDate("2031-03", 10) });
      const third = await createIncomePayment(tx, { invoiceId, createdAt: monthDate("2031-03", 15) });

      const sliced = await AccountingPaymentRepository.findProfitLossIncome(
        { month: "2031-03" },
        { limit: 2, offset: 0 },
        tx
      );
      expect(sliced.totalCount).toBe(fullCount);
      expect(sliced.rows).toHaveLength(2);

      const full = await queryMonth(tx, "2031-03");
      expect(full.totalCount).toBe(fullCount);
      const fullIds = full.rows.map(row => row.paymentId);
      expect(fullIds.indexOf(third.id)).toBeLessThan(fullIds.indexOf(second.id));
      expect(fullIds.indexOf(second.id)).toBeLessThan(fullIds.indexOf(first.id));

      const offsetPastMine = await AccountingPaymentRepository.findProfitLossIncome(
        { month: "2031-03" },
        { limit: 10_000, offset: fullCount },
        tx
      );
      expect(offsetPastMine.rows).toEqual([]);
      expect(offsetPastMine.totalCount).toBe(fullCount);
    });
  });

  test("joined columns resolve student, parent, payment method, and package/invoice provenance", async () => {
    await runInRollback(async tx => {
      const fixture = await setupIncomeFixture(tx);
      const plan = await PackagePlanRepository.create(tx, {
        codename: `pl_income_join_${randomUUID().slice(0, 8)}`,
        displayName: "Income Join Fixture Plan",
        description: null,
        creditHours: "10.00",
        priceAmount: "100.00",
        currency: CurrencyCode.USD,
      });
      const createdAt = monthDate("2032-01", 12);

      const payment = await createIncomePayment(tx, {
        invoiceId: fixture.invoiceId,
        createdAt,
        currency: CurrencyCode.EUR,
        packagePlanId: plan.id,
      });

      const row = (await queryMonth(tx, "2032-01")).rows.find(item => item.paymentId === payment.id);
      if (!row) throw new Error("fixture payment row missing from the month page");
      expect(row.studentName).toBe(fixture.studentName);
      expect(row.parentName).toBe(fixture.parentUserName);
      expect(row.amount).toBe("100.00");
      expect(row.currency).toBe(CurrencyCode.EUR);
      expect(row.paymentMethodType).toBe(PaymentMethodType.CASH);
      expect(row.packageName).toBe(plan.displayName);
      expect(row.invoiceId).toBe(fixture.invoiceId);
      // Pre-conversion rows carry a null conversion; the service composes the aggregate.
      expect(row.convertedAmount).toBeNull();
      expect(row.paymentDate).toBe(createdAt.toISOString());
    });
  });

  test("payments on soft-deleted invoices are excluded from the month page", async () => {
    await runInRollback(async tx => {
      const { invoiceId } = await setupIncomeFixture(tx);
      const baseline = (await queryMonth(tx, "2033-02")).totalCount;

      const payment = await createIncomePayment(tx, { invoiceId, createdAt: monthDate("2033-02", 8) });

      const before = await queryMonth(tx, "2033-02");
      expect(before.totalCount).toBe(baseline + 1);
      expect(before.rows.map(row => row.paymentId)).toContain(payment.id);

      await tx.update(invoices).set({ deletedAt: new Date() }).where(eq(invoices.id, invoiceId));

      const after = await queryMonth(tx, "2033-02");
      expect(after.rows.map(row => row.paymentId)).not.toContain(payment.id);
      expect(after.totalCount).toBe(baseline);
    });
  });

  test("payments without a parent link still resolve with a null parent name", async () => {
    await runInRollback(async tx => {
      const studentUser = await createTestUser(tx, {
        name: "Orphan Student User",
        email: `orphan-${randomUUID().slice(0, 8)}@example.com`,
      });
      const now = new Date();
      const [student] = await tx
        .insert(students)
        .values({
          parentId: null,
          userId: studentUser.id,
          name: "Orphan Student",
          status: "REGULAR",
          idempotencyKey: randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (!student) throw new Error("fixture student insert returned no rows");

      const { parent } = await setupStudent(tx);
      if (!parent.id) throw new Error("fixture parent must exist for the invoice owner");
      const [invoice] = await tx
        .insert(invoices)
        .values({
          parentId: parent.id,
          studentId: student.id,
          issueDate: "2034-06-01",
          dueDate: "2034-06-01",
          amount: "100.00",
          currency: CurrencyCode.USD,
          status: "PAID",
          invoiceType: "CREDIT_HOURS_PACKAGE",
          idempotencyKey: `pl-income-orphan-inv-${randomUUID()}`,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (!invoice) throw new Error("fixture invoice insert returned no rows");

      const payment = await createIncomePayment(tx, {
        invoiceId: invoice.id,
        createdAt: monthDate("2034-06", 9),
      });

      const row = (await queryMonth(tx, "2034-06")).rows.find(item => item.paymentId === payment.id);
      if (!row) throw new Error("fixture payment row missing from the month page");
      expect(row.studentName).toBe("Orphan Student");
      expect(row.parentName).toBeNull();
    });
  });

  test.each(["%", "%%", ".*", "2030-%", "2030-1", ""])(
    "a wildcard or malformed month %j matches no rows instead of widening the filter",
    async rawMonth => {
      await runInRollback(async tx => {
        const { invoiceId } = await setupIncomeFixture(tx);
        await createIncomePayment(tx, { invoiceId, createdAt: monthDate("2030-05", 5) });
        await createIncomePayment(tx, { invoiceId, createdAt: monthDate("2030-05", 20) });

        const page = await AccountingPaymentRepository.findProfitLossIncome(
          { month: rawMonth },
          { limit: 10_000, offset: 0 },
          tx
        );

        expect(page.rows).toHaveLength(0);
        expect(page.totalCount).toBe(0);
      });
    }
  );
});
