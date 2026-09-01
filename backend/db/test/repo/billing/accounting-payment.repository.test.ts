import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { AccountingPaymentRepository, PackagePlanRepository } from "@/backend/db/repo/billing";
import { invoices } from "@/backend/db/schema";
import { setupStudent } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { PaymentGateway } from "@/backend/enum";
import type { AccountingPaymentFilter, DBTransaction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/** Creates a minimal CREDIT_HOURS_PACKAGE invoice owned by the fixture student. */
async function createInvoice(
  tx: DBTransaction,
  args: { parentId: string; studentId: string; status?: "PAID" | "UNPAID"; issueDate?: string }
) {
  const now = new Date();
  const [invoice] = await tx
    .insert(invoices)
    .values({
      parentId: args.parentId,
      studentId: args.studentId,
      issueDate: args.issueDate ?? "2026-07-01",
      dueDate: args.issueDate ?? "2026-07-01",
      amount: "100.00",
      currency: CurrencyCode.USD,
      status: args.status ?? "PAID",
      invoiceType: "CREDIT_HOURS_PACKAGE",
      idempotencyKey: `acct-repo-inv-${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return invoice;
}

const byId = (a: string, b: string) => a.localeCompare(b);

type CreatePaymentArgs = {
  invoiceId: string;
  gateway?: PaymentGateway;
  currency?: CurrencyCode;
  creditHours?: string | null;
  isPaidStatusOn?: boolean;
  paymentDate?: Date;
};

async function createPayment(tx: DBTransaction, args: CreatePaymentArgs) {
  return AccountingPaymentRepository.create(tx, {
    invoiceId: args.invoiceId,
    amount: "100.00",
    currency: args.currency ?? CurrencyCode.USD,
    paymentDate: args.paymentDate ?? new Date("2026-07-05T12:00:00.000Z"),
    packagePlanId: null,
    paymentGateway: args.gateway ?? PaymentGateway.BANK,
    creditHours: args.creditHours ?? "10.00",
    isPaidStatusOn: args.isPaidStatusOn ?? true,
    paymentNote: null,
    idempotencyKey: `acct-repo-pay-${randomUUID()}`,
  });
}

describe("AccountingPaymentRepository", () => {
  test("create + findById join student name and package snapshot", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);
      if (!student.parentId) throw new Error("fixture student must be parent-linked");

      const plan = await PackagePlanRepository.create(tx, {
        codename: `acctrepo_join_${randomUUID().slice(0, 8)}`,
        displayName: "Join Fixture Plan",
        description: null,
        creditHours: "10.00",
        priceAmount: "100.00",
        currency: CurrencyCode.USD,
      });

      const invoice = await createInvoice(tx, { parentId: student.parentId, studentId: student.id });
      const created = await AccountingPaymentRepository.create(tx, {
        invoiceId: invoice.id,
        amount: "100.00",
        currency: CurrencyCode.USD,
        paymentDate: new Date(),
        packagePlanId: plan.id,
        paymentGateway: PaymentGateway.BANK,
        creditHours: "10.00",
        isPaidStatusOn: true,
        paymentNote: "join check",
        idempotencyKey: `acctrepo-join-${randomUUID()}`,
      });

      const joined = await AccountingPaymentRepository.findById(created.id, tx);
      expect(joined).not.toBeNull();
      expect(joined?.studentName).toBe(student.name);
      expect(joined?.packageCodename).toBe(plan.codename);
      expect(joined?.packageName).toBe(plan.displayName);
      expect(joined?.invoiceStatus).toBe("PAID");
      expect(joined?.studentId).toBe(student.id);
    });
  });

  test("listPaginated applies AND combinations of student / date-range / unpaid filters", async () => {
    await runInRollback(async tx => {
      const { student: studentA } = await setupStudent(tx);
      const { student: studentB } = await setupStudent(tx);
      if (!studentA.parentId || !studentB.parentId) throw new Error("fixture students must be parent-linked");

      const invoiceA = await createInvoice(tx, { parentId: studentA.parentId, studentId: studentA.id });
      const invoiceB = await createInvoice(tx, { parentId: studentB.parentId, studentId: studentB.id });

      // A1: July unpaid (target of the combined filter below)
      await createPayment(tx, {
        invoiceId: invoiceA.id,
        isPaidStatusOn: false,
        paymentDate: new Date("2026-07-10T09:00:00.000Z"),
      });
      // A2: July paid
      await createPayment(tx, {
        invoiceId: invoiceA.id,
        isPaidStatusOn: true,
        paymentDate: new Date("2026-07-20T09:00:00.000Z"),
      });
      // A3: June — outside the range filter below
      await createPayment(tx, {
        invoiceId: invoiceA.id,
        isPaidStatusOn: true,
        paymentDate: new Date("2026-06-15T09:00:00.000Z"),
      });
      // B1: same shape as A2 but different student
      await createPayment(tx, {
        invoiceId: invoiceB.id,
        isPaidStatusOn: true,
        paymentDate: new Date("2026-07-20T09:30:00.000Z"),
      });

      // Filter by student only.
      const forA = await AccountingPaymentRepository.listPaginated({ studentId: studentA.id }, null, tx);
      expect(forA.every(row => row.studentId === studentA.id)).toBe(true);
      expect(forA).toHaveLength(3);

      // Student AND date range AND unpaidOnly.
      const combined: AccountingPaymentFilter = {
        studentId: studentA.id,
        fromDate: "2026-07-01",
        toDate: "2026-07-31",
        unpaidOnly: true,
      };
      const unpaidJulyA = await AccountingPaymentRepository.listPaginated(combined, null, tx);
      expect(unpaidJulyA).toHaveLength(1);
      expect(unpaidJulyA[0]?.isPaidStatusOn).toBe(false);

      // Range is inclusive on both bounds.
      const paidJuly20 = await AccountingPaymentRepository.listPaginated(
        { studentId: studentA.id, fromDate: "2026-07-20", toDate: "2026-07-20" },
        null,
        tx
      );
      expect(paidJuly20).toHaveLength(1);
      expect(paidJuly20[0]?.isPaidStatusOn).toBe(true);

      // Parent scoping flows through the students join.
      const viaParent = await AccountingPaymentRepository.listPaginated({ parentId: studentA.parentId }, null, tx);
      expect(viaParent).toHaveLength(3);
      expect(viaParent.every(row => row.parentId === studentA.parentId)).toBe(true);
    });
  });

  test("findPaidSiblingsByInvoice excludes the queried payment and unpaid rows", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);
      if (!student.parentId) throw new Error("fixture student must be parent-linked");
      const invoice = await createInvoice(tx, { parentId: student.parentId, studentId: student.id });

      const paidOne = await createPayment(tx, { invoiceId: invoice.id, isPaidStatusOn: true });
      const paidTwo = await createPayment(tx, { invoiceId: invoice.id, isPaidStatusOn: true });
      await createPayment(tx, { invoiceId: invoice.id, isPaidStatusOn: false });

      const siblingsOfOne = await AccountingPaymentRepository.findPaidSiblingsByInvoice(tx, invoice.id, paidOne.id);
      expect(siblingsOfOne.map(row => row.id)).toEqual([paidTwo.id]);

      const siblingsOfTwo = await AccountingPaymentRepository.findPaidSiblingsByInvoice(tx, invoice.id, paidTwo.id);
      expect(siblingsOfTwo.map(row => row.id)).toEqual([paidOne.id]);
    });
  });

  test('generateIdempotencyKey is deterministic and substitutes "" for a null plan (EC-18)', async () => {
    const when = new Date("2026-07-05T12:00:00.000Z");
    const base = {
      studentId: "s-1",
      amount: 150,
      currency: "USD",
      paymentDate: when,
      paymentGateway: "BANK",
    };

    const withNull = AccountingPaymentRepository.generateIdempotencyKey({ ...base, packagePlanId: null });
    const withEmptyString = AccountingPaymentRepository.generateIdempotencyKey({ ...base, packagePlanId: "" });
    expect(withNull).toBe(withEmptyString);
    expect(withNull.startsWith("acctpay-")).toBe(true);

    const replay = AccountingPaymentRepository.generateIdempotencyKey({ ...base, packagePlanId: null });
    expect(replay).toBe(withNull);

    const otherGateway = AccountingPaymentRepository.generateIdempotencyKey({
      ...base,
      packagePlanId: null,
      paymentGateway: "OTHER",
    });
    expect(otherGateway).not.toBe(withNull);
  });

  test("findById returns null for an unknown payment id", async () => {
    await runInRollback(async tx => {
      expect(await AccountingPaymentRepository.findById(randomUUID(), tx)).toBeNull();
    });
  });

  test("listPaginated without filters returns rows; single-bound date filters apply", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);
      if (!student.parentId) throw new Error("fixture student must be parent-linked");
      const invoice = await createInvoice(tx, { parentId: student.parentId, studentId: student.id });
      const payment = await createPayment(tx, {
        invoiceId: invoice.id,
        paymentDate: new Date("2026-07-15T10:00:00.000Z"),
      });

      // Empty filter exercises the no-conditions branch of buildFilterConditions.
      const unfiltered = await AccountingPaymentRepository.listPaginated({}, null, tx);
      expect(unfiltered.some(row => row.id === payment.id)).toBe(true);

      // fromDate only (lower bound, no upper bound).
      const fromOnly = await AccountingPaymentRepository.listPaginated(
        { studentId: student.id, fromDate: "2026-07-16" },
        null,
        tx
      );
      expect(fromOnly).toHaveLength(0);

      // toDate only (inclusive upper bound, no lower bound).
      const toOnly = await AccountingPaymentRepository.listPaginated(
        { studentId: student.id, toDate: "2026-07-15" },
        null,
        tx
      );
      expect(toOnly.map(row => row.id)).toEqual([payment.id]);
    });
  });

  test("countForFilter counts filtered rows and returns 0 for no matches", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);
      if (!student.parentId) throw new Error("fixture student must be parent-linked");
      const invoice = await createInvoice(tx, { parentId: student.parentId, studentId: student.id });
      await createPayment(tx, { invoiceId: invoice.id, isPaidStatusOn: true });
      await createPayment(tx, { invoiceId: invoice.id, isPaidStatusOn: false });

      expect(await AccountingPaymentRepository.countForFilter({ studentId: student.id }, tx)).toBe(2);
      expect(await AccountingPaymentRepository.countForFilter({ studentId: student.id, unpaidOnly: true }, tx)).toBe(1);
      expect(await AccountingPaymentRepository.countForFilter({ studentId: randomUUID() }, tx)).toBe(0);
    });
  });

  test("findByIds returns the requested rows and treats an empty id list as a no-op", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);
      if (!student.parentId) throw new Error("fixture student must be parent-linked");
      const invoice = await createInvoice(tx, { parentId: student.parentId, studentId: student.id });
      const first = await createPayment(tx, { invoiceId: invoice.id });
      const second = await createPayment(tx, { invoiceId: invoice.id });

      expect(await AccountingPaymentRepository.findByIds([], tx)).toEqual([]);

      const found = await AccountingPaymentRepository.findByIds([first.id, second.id], tx);
      expect(found.map(row => row.id).toSorted(byId)).toEqual([first.id, second.id].toSorted(byId));

      expect(await AccountingPaymentRepository.findByIds([randomUUID()], tx)).toEqual([]);
    });
  });

  test("update applies the patch and returns null for an unknown id", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);
      if (!student.parentId) throw new Error("fixture student must be parent-linked");
      const invoice = await createInvoice(tx, { parentId: student.parentId, studentId: student.id });
      const created = await createPayment(tx, { invoiceId: invoice.id });

      const updated = await AccountingPaymentRepository.update(tx, created.id, {
        paymentGateway: PaymentGateway.OTHER,
        paymentNote: "edited note",
        creditHours: "12.50",
        isPaidStatusOn: false,
      });
      expect(updated?.paymentGateway).toBe(PaymentGateway.OTHER);
      expect(updated?.paymentNote).toBe("edited note");
      expect(Number(updated?.creditHours ?? "0")).toBe(12.5);
      expect(updated?.isPaidStatusOn).toBe(false);

      expect(await AccountingPaymentRepository.update(tx, randomUUID(), { paymentNote: "ghost" })).toBeNull();
    });
  });

  test("findLastPaymentCurrency breaks same-day ties by creation order (newest created wins)", async () => {
    await runInRollback(async tx => {
      const { student } = await setupStudent(tx);
      if (!student.parentId) throw new Error("fixture student must be parent-linked");
      const invoice = await createInvoice(tx, { parentId: student.parentId, studentId: student.id });

      const sameDay = new Date("2026-07-05T12:00:00.000Z");
      await createPayment(tx, { invoiceId: invoice.id, paymentDate: sameDay });
      // Distinct createdAt so the same-date tiebreak is deterministic.
      await new Promise(resolve => setTimeout(resolve, 10));
      await createPayment(tx, { invoiceId: invoice.id, paymentDate: sameDay, currency: CurrencyCode.EUR });

      expect(await AccountingPaymentRepository.findLastPaymentCurrency(student.id, tx)).toBe(CurrencyCode.EUR);
    });
  });
});
