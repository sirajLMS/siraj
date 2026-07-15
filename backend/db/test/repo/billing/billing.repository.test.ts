import { beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { BillingRepository } from "@/backend/db/repo";
import { currencyExchangeAuditLogs, currencyExchangeRates, invoices } from "@/backend/db/schema";
import { createTestParent, createTestUser } from "@/backend/db/test/entity-setup";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode, InvoiceStatus, InvoiceType } from "@/backend/enum";
import { PaginationArgs } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

let tErrors: ErrorsLabels;
beforeAll(async () => {
  tErrors = await getServerTranslations("en", "errors");
});

async function expectRepoError(fn: () => Promise<unknown>): Promise<Error> {
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (error) {
    errorCaught = error;
  }
  expect(errorCaught).not.toBeNull();
  return errorCaught as Error;
}

async function createOverdueInvoice(
  tx: Parameters<typeof runInRollback>[0] extends (tx: infer T) => unknown ? T : never,
  parentId: string,
  amount: string,
  dueDateOffsetDays: number,
  status:
    | InvoiceStatus.UNPAID
    | InvoiceStatus.PAID
    | InvoiceStatus.CANCELLED
    | InvoiceStatus.PAYMENT_PENDING = InvoiceStatus.UNPAID
) {
  const now = new Date();
  const dueDate = new Date(now.getTime() + dueDateOffsetDays * 86400000);
  const issueDate = new Date(dueDate.getTime() - 30 * 86400000);

  const [invoice] = await tx
    .insert(invoices)
    .values({
      parentId,
      issueDate: issueDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      amount,
      currency: CurrencyCode.USD,
      status,
      invoiceType: InvoiceType.MONTHLY,
      idempotencyKey: randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return invoice;
}

describe("BillingRepository.getUnpaidInvoicesSummary", () => {
  test("returns empty summary when no overdue invoices exist", async () => {
    await runInRollback(async tx => {
      const beforeResult = await BillingRepository.getUnpaidInvoicesSummary(tx);

      const result = await BillingRepository.getUnpaidInvoicesSummary(tx);

      expect(result.id).toBe("unpaid-invoices-summary");
      expect(result.totalOverdueInvoices).toBe(beforeResult.totalOverdueInvoices);
      expect(result.items).toHaveLength(beforeResult.items.length);
    });
  });

  test("returns overdue invoices grouped by parent", async () => {
    await runInRollback(async tx => {
      const beforeResult = await BillingRepository.getUnpaidInvoicesSummary(tx);

      const parentUser = await createTestUser(tx, {
        name: "Billing Parent",
        email: `billing-${randomUUID()}@test.com`,
      });
      const parent = await createTestParent(tx, parentUser.id);

      await createOverdueInvoice(tx, parent.id, "100.00", -10);
      await createOverdueInvoice(tx, parent.id, "50.00", -5);

      const result = await BillingRepository.getUnpaidInvoicesSummary(tx);

      expect(result.totalOverdueInvoices).toBe(beforeResult.totalOverdueInvoices + 2);
      const testItem = result.items.find(i => i.id === parent.id);
      expect(testItem).toBeDefined();
      expect(testItem?.userId).toBe(parentUser.id);
      expect(testItem?.userName).toBe("Billing Parent");
      expect(testItem?.totalUnpaidAmount).toBe("150.00");
      expect(testItem?.overdueCount).toBe(2);
      expect(testItem?.currency).toBe(CurrencyCode.USD);
    });
  });

  test("excludes paid and future-due invoices", async () => {
    await runInRollback(async tx => {
      const beforeResult = await BillingRepository.getUnpaidInvoicesSummary(tx);

      const parentUser = await createTestUser(tx, { name: "Mixed Parent", email: `mixed-${randomUUID()}@test.com` });
      const parent = await createTestParent(tx, parentUser.id);

      await createOverdueInvoice(tx, parent.id, "100.00", -10, InvoiceStatus.UNPAID);
      await createOverdueInvoice(tx, parent.id, "200.00", -5, InvoiceStatus.PAID);
      await createOverdueInvoice(tx, parent.id, "300.00", 10, InvoiceStatus.UNPAID);

      const result = await BillingRepository.getUnpaidInvoicesSummary(tx);

      expect(result.totalOverdueInvoices).toBe(beforeResult.totalOverdueInvoices + 1);
      const testItem = result.items.find(i => i.id === parent.id);
      expect(testItem).toBeDefined();
      expect(testItem?.totalUnpaidAmount).toBe("100.00");
    });
  });

  test("groups multiple parents separately", async () => {
    await runInRollback(async tx => {
      const beforeResult = await BillingRepository.getUnpaidInvoicesSummary(tx);

      const user1 = await createTestUser(tx, { name: "Parent One", email: `p1-${randomUUID()}@test.com` });
      const parent1 = await createTestParent(tx, user1.id);

      const user2 = await createTestUser(tx, { name: "Parent Two", email: `p2-${randomUUID()}@test.com` });
      const parent2 = await createTestParent(tx, user2.id);

      await createOverdueInvoice(tx, parent1.id, "75.00", -3);
      await createOverdueInvoice(tx, parent2.id, "125.00", -7);

      const result = await BillingRepository.getUnpaidInvoicesSummary(tx);

      expect(result.totalOverdueInvoices).toBe(beforeResult.totalOverdueInvoices + 2);
      expect(result.items).toHaveLength(beforeResult.items.length + 2);

      const parent1Item = result.items.find(i => i.id === parent1.id);
      const parent2Item = result.items.find(i => i.id === parent2.id);

      expect(parent1Item?.totalUnpaidAmount).toBe("75.00");
      expect(parent2Item?.totalUnpaidAmount).toBe("125.00");
    });
  });
});

describe("BillingRepository — getInvoicesForParent", () => {
  test("returns invoice history for a parent with invoices", async () => {
    await runInRollback(async tx => {
      const parentUser = await createTestUser(tx, {
        name: "Billing Parent Hist",
        email: `billing-hist-${randomUUID()}@test.com`,
      });
      const parent = await createTestParent(tx, parentUser.id);

      const inv1 = await createOverdueInvoice(tx, parent.id, "120.00", -5, InvoiceStatus.UNPAID);
      const inv2 = await createOverdueInvoice(tx, parent.id, "80.00", -10, InvoiceStatus.PAID);

      const result = await BillingRepository.getInvoicesForParent(parent.id, null, null, tx);

      expect(result.rows).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.pageInfo).toBeNull();

      const itemsMap = new Map(result.rows.map(item => [item.id, item]));

      const item1 = itemsMap.get(inv1.id);
      expect(item1).toBeDefined();
      expect(item1?.issueDate).toBe(inv1.issueDate);
      expect(item1?.dueDate).toBe(inv1.dueDate);
      expect(item1?.amount).toBe("120.00");
      expect(item1?.currency).toBe(CurrencyCode.USD);
      expect(item1?.status).toBe(InvoiceStatus.UNPAID);
      expect(item1?.invoiceType).toBe(InvoiceType.MONTHLY);
      expect(item1?.paidDate).toBeNull();

      const item2 = itemsMap.get(inv2.id);
      expect(item2).toBeDefined();
      expect(item2?.amount).toBe("80.00");
      expect(item2?.status).toBe(InvoiceStatus.PAID);
    });
  });

  test("returns empty rows for parent with no invoices", async () => {
    await runInRollback(async tx => {
      const result = await BillingRepository.getInvoicesForParent(
        "00000000-0000-0000-0000-000000000000",
        null,
        null,
        tx
      );
      expect(result.rows).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  test("excludes soft-deleted invoices", async () => {
    await runInRollback(async tx => {
      const parentUser = await createTestUser(tx, {
        name: "Billing Parent Soft",
        email: `billing-soft-${randomUUID()}@test.com`,
      });
      const parent = await createTestParent(tx, parentUser.id);

      const now = new Date();
      const [softDeletedInv] = await tx
        .insert(invoices)
        .values({
          parentId: parent.id,
          issueDate: now.toISOString().split("T")[0],
          dueDate: now.toISOString().split("T")[0],
          amount: "150.00",
          currency: CurrencyCode.USD,
          status: InvoiceStatus.UNPAID,
          invoiceType: InvoiceType.MONTHLY,
          idempotencyKey: randomUUID(),
          deletedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const result = await BillingRepository.getInvoicesForParent(parent.id, null, null, tx);
      expect(result.rows.some(item => item.id === softDeletedInv.id)).toBeFalse();
    });
  });
});

async function setupInvoiceTest(
  tx: DBTransaction,
  status: InvoiceStatus.UNPAID | InvoiceStatus.PAID = InvoiceStatus.UNPAID
) {
  const parentUser = await createTestUser(tx, {
    name: "Delete Test Parent",
    email: `del-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, parentUser.id);
  const invoice = await createOverdueInvoice(tx, parent.id, "100.00", -5, status);
  return { parent, invoice };
}

describe("BillingRepository — deleteInvoice", () => {
  test("soft-deletes an UNPAID invoice by setting deletedAt", async () => {
    await runInRollback(async tx => {
      const { invoice } = await setupInvoiceTest(tx);
      const result = await BillingRepository.deleteInvoice(invoice.id, tErrors, tx);

      expect(result.id).toBe(invoice.id);
      expect(result.deletedAt).not.toBeNull();
      expect(result.version).toBeGreaterThan(0);
    });
  });

  test("soft-deletes a PAID invoice", async () => {
    await runInRollback(async tx => {
      const { invoice } = await setupInvoiceTest(tx);
      await BillingRepository.markInvoiceAsPaid(invoice.id, tErrors, undefined, tx);
      const result = await BillingRepository.deleteInvoice(invoice.id, tErrors, tx);
      expect(result.deletedAt).not.toBeNull();
    });
  });

  test("throws when deleting a non-existent invoice", async () => {
    await runInRollback(async tx => {
      const error = await expectRepoError(() =>
        BillingRepository.deleteInvoice("00000000-0000-0000-0000-000000000000", tErrors, tx)
      );
      expect(error.message).toContain("not found");
    });
  });

  test("throws when deleting an already-deleted invoice", async () => {
    await runInRollback(async tx => {
      const { invoice } = await setupInvoiceTest(tx);
      await BillingRepository.deleteInvoice(invoice.id, tErrors, tx);
      const error = await expectRepoError(() => BillingRepository.deleteInvoice(invoice.id, tErrors, tx));
      expect(error.message).toContain("not found");
    });
  });

  test("excludes soft-deleted invoices from getInvoicesForParent", async () => {
    await runInRollback(async tx => {
      const { parent, invoice } = await setupInvoiceTest(tx);
      await BillingRepository.deleteInvoice(invoice.id, tErrors, tx);
      const result = await BillingRepository.getInvoicesForParent(parent.id, null, null, tx);
      expect(result.rows.find(inv => inv.id === invoice.id)).toBeUndefined();
    });
  });
});

async function setupUnpaidInvoice(tx: DBTransaction) {
  const parentUser = await createTestUser(tx, {
    name: "MarkPaid Parent",
    email: `markpaid-${randomUUID()}@test.com`,
  });
  const parent = await createTestParent(tx, parentUser.id);
  const invoice = await createOverdueInvoice(tx, parent.id, "150.00", -5, InvoiceStatus.UNPAID);
  return { parent, invoice };
}

describe("BillingRepository — markInvoiceAsPaid", () => {
  test("marks an UNPAID invoice as PAID and sets paidDate", async () => {
    await runInRollback(async tx => {
      const { invoice } = await setupUnpaidInvoice(tx);
      const result = await BillingRepository.markInvoiceAsPaid(invoice.id, tErrors, undefined, tx);

      expect(result.id).toBe(invoice.id);
      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(result.paidDate).not.toBeNull();
      expect(result.version).toBeGreaterThan(0);

      const today = new Date().toISOString().split("T")[0];
      expect(result.paidDate).toBe(today);
    });
  });

  test("throws when marking a PAID invoice as paid again", async () => {
    await runInRollback(async tx => {
      const { invoice } = await setupUnpaidInvoice(tx);
      await BillingRepository.markInvoiceAsPaid(invoice.id, tErrors, undefined, tx);
      const error = await expectRepoError(() =>
        BillingRepository.markInvoiceAsPaid(invoice.id, tErrors, undefined, tx)
      );
      expect(error.message.toLowerCase()).toContain("already");
    });
  });

  test("throws when invoice ID does not exist", async () => {
    await runInRollback(async tx => {
      const error = await expectRepoError(() =>
        BillingRepository.markInvoiceAsPaid("00000000-0000-0000-0000-000000000001", tErrors, undefined, tx)
      );
      expect(error.message).toContain("not found");
    });
  });

  test("throws when invoice is soft-deleted", async () => {
    await runInRollback(async tx => {
      const { invoice } = await setupUnpaidInvoice(tx);
      await BillingRepository.deleteInvoice(invoice.id, tErrors, tx);
      const error = await expectRepoError(() =>
        BillingRepository.markInvoiceAsPaid(invoice.id, tErrors, undefined, tx)
      );
      expect(error.message).toContain("not found");
    });
  });

  test("throws on version mismatch", async () => {
    await runInRollback(async tx => {
      const { invoice } = await setupUnpaidInvoice(tx);
      const error = await expectRepoError(() => BillingRepository.markInvoiceAsPaid(invoice.id, tErrors, 9999, tx));
      expect(error.message).toContain("version mismatch");
    });
  });

  test("succeeds when expectedVersion matches", async () => {
    await runInRollback(async tx => {
      const { invoice } = await setupUnpaidInvoice(tx);
      const [current] = await tx.select().from(invoices).where(eq(invoices.id, invoice.id)).limit(1);
      const result = await BillingRepository.markInvoiceAsPaid(invoice.id, tErrors, current.version, tx);
      expect(result.status).toBe(InvoiceStatus.PAID);
    });
  });
});

async function insertExchangeRateRow(
  tx: DBTransaction,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rate: string,
  source: string,
  effectiveDate: Date
) {
  const now = new Date();
  const [row] = await tx
    .insert(currencyExchangeRates)
    .values({
      fromCurrency,
      toCurrency,
      rate,
      source,
      effectiveDate,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
}

describe("BillingRepository — updateExchangeRate", () => {
  test("accepts changedByUserId: null and writes audit log with null changed_by_user_id", async () => {
    await runInRollback(async tx => {
      const now = new Date();
      const result = await BillingRepository.updateExchangeRate(
        {
          fromCurrency: CurrencyCode.USD,
          toCurrency: CurrencyCode.EGP,
          rate: "48.123456",
          source: "cron",
          effectiveDate: now,
        },
        null,
        tx
      );

      expect(result.fromCurrency).toBe(CurrencyCode.USD);
      expect(result.toCurrency).toBe(CurrencyCode.EGP);
      expect(result.rate).toBe("48.123456");

      const auditRows = await tx
        .select()
        .from(currencyExchangeAuditLogs)
        .where(
          and(
            eq(currencyExchangeAuditLogs.fromCurrency, CurrencyCode.USD),
            eq(currencyExchangeAuditLogs.toCurrency, CurrencyCode.EGP),
            eq(currencyExchangeAuditLogs.newRate, "48.123456")
          )
        )
        .orderBy(desc(currencyExchangeAuditLogs.createdAt))
        .limit(1);

      const audit = auditRows[0];
      expect(audit).toBeDefined();
      expect(audit?.changedByUserId).toBeNull();
      expect(audit?.source).toBe("cron");
    });
  });

  test("records oldRate from previous latest row when updating", async () => {
    await runInRollback(async tx => {
      const earlier = new Date(Date.now() - 2 * 86400000);
      await insertExchangeRateRow(tx, CurrencyCode.USD, CurrencyCode.SAR, "3.750000", "seed", earlier);

      const result = await BillingRepository.updateExchangeRate(
        {
          fromCurrency: CurrencyCode.USD,
          toCurrency: CurrencyCode.SAR,
          rate: "3.760000",
          source: "manual",
          effectiveDate: new Date(),
        },
        null,
        tx
      );

      expect(result.rate).toBe("3.760000");

      const auditRows = await tx
        .select()
        .from(currencyExchangeAuditLogs)
        .where(
          and(
            eq(currencyExchangeAuditLogs.fromCurrency, CurrencyCode.USD),
            eq(currencyExchangeAuditLogs.toCurrency, CurrencyCode.SAR),
            eq(currencyExchangeAuditLogs.newRate, "3.760000")
          )
        )
        .orderBy(desc(currencyExchangeAuditLogs.createdAt))
        .limit(1);

      const audit = auditRows[0];
      expect(audit).toBeDefined();
      expect(audit?.oldRate).toBe("3.750000");
      expect(audit?.newRate).toBe("3.760000");
    });
  });
});

describe("BillingRepository — updateExchangeRateInTx", () => {
  test("writes rate + audit inside a provided transaction without nesting", async () => {
    await runInRollback(async tx => {
      const now = new Date();
      const result = await BillingRepository.updateExchangeRateInTx(
        {
          fromCurrency: CurrencyCode.EUR,
          toCurrency: CurrencyCode.USD,
          rate: "1.085000",
          source: "openexchangerates",
          effectiveDate: now,
        },
        null,
        tx
      );

      expect(result.fromCurrency).toBe(CurrencyCode.EUR);
      expect(result.rate).toBe("1.085000");

      const auditRows = await tx
        .select()
        .from(currencyExchangeAuditLogs)
        .where(
          and(
            eq(currencyExchangeAuditLogs.fromCurrency, CurrencyCode.EUR),
            eq(currencyExchangeAuditLogs.toCurrency, CurrencyCode.USD),
            eq(currencyExchangeAuditLogs.newRate, "1.085000")
          )
        )
        .orderBy(desc(currencyExchangeAuditLogs.createdAt))
        .limit(1);

      const audit = auditRows[0];
      expect(audit).toBeDefined();
      expect(audit?.changedByUserId).toBeNull();
    });
  });
});

describe("BillingRepository — listLatestExchangeRates", () => {
  test("returns one latest row per (from, to) pair ordered by effective_date DESC", async () => {
    await runInRollback(async tx => {
      const older = new Date(Date.now() - 3 * 86400000);
      const newer = new Date(Date.now() - 1 * 86400000);

      await insertExchangeRateRow(tx, CurrencyCode.USD, CurrencyCode.EGP, "47.000000", "seed", older);
      await insertExchangeRateRow(tx, CurrencyCode.USD, CurrencyCode.EGP, "48.500000", "cron", newer);
      await insertExchangeRateRow(tx, CurrencyCode.USD, CurrencyCode.SAR, "3.750000", "seed", older);

      const result = await BillingRepository.listLatestExchangeRates(null, tx);

      const egpRow = result.find(r => r.fromCurrency === CurrencyCode.USD && r.toCurrency === CurrencyCode.EGP);
      expect(egpRow).toBeDefined();
      expect(egpRow?.rate).toBe("48.500000");

      const sarRow = result.find(r => r.fromCurrency === CurrencyCode.USD && r.toCurrency === CurrencyCode.SAR);
      expect(sarRow).toBeDefined();
      expect(sarRow?.rate).toBe("3.750000");

      const egpCount = result.filter(r => r.toCurrency === CurrencyCode.EGP).length;
      expect(egpCount).toBe(1);
    });
  });
});

describe("BillingRepository — listExchangeRateHistory", () => {
  test("returns rows filtered by (from, to) ordered DESC and respects maxDays cap", async () => {
    await runInRollback(async tx => {
      const within = new Date(Date.now() - 5 * 86400000);
      const outside = new Date(Date.now() - 200 * 86400000);

      await insertExchangeRateRow(tx, CurrencyCode.USD, CurrencyCode.AED, "3.670000", "seed", within);
      await insertExchangeRateRow(tx, CurrencyCode.USD, CurrencyCode.AED, "3.680000", "cron", new Date());
      await insertExchangeRateRow(tx, CurrencyCode.USD, CurrencyCode.AED, "3.500000", "old", outside);

      const result = await BillingRepository.listExchangeRateHistory(CurrencyCode.USD, CurrencyCode.AED, null, 90, tx);

      expect(result.id).toBe("exchange-rate-history-USD-AED");
      expect(result.rows).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.pageInfo).toBeNull();

      expect(result.rows[0]?.rate).toBe("3.680000");
      expect(result.rows[1]?.rate).toBe("3.670000");
    });
  });

  test("paginates with pageInfo and caps limit at 100", async () => {
    await runInRollback(async tx => {
      const now = new Date();
      const baseTime = now.getTime();
      for (let i = 0; i < 3; i++) {
        await insertExchangeRateRow(
          tx,
          CurrencyCode.USD,
          CurrencyCode.KWD,
          `${0.307 + i / 1000}`,
          "seed",
          new Date(baseTime - i * 86400000)
        );
      }

      const pagination = new PaginationArgs({
        first: 2,
        page: 1,
        maxCount: 100,
      });

      const result = await BillingRepository.listExchangeRateHistory(
        CurrencyCode.USD,
        CurrencyCode.KWD,
        pagination,
        90,
        tx
      );

      expect(result.rows).toHaveLength(2);
      expect(result.totalCount).toBe(3);
      expect(result.pageInfo?.hasMorePages).toBe(true);
      expect(result.pageInfo?.lastPage).toBe(2);
      expect(result.pageInfo?.perPage).toBe(2);
    });
  });
});

describe("BillingRepository — getParentBillingSummary", () => {
  test("returns next unpaid invoice by earliest due date and pending payment count", async () => {
    await runInRollback(async tx => {
      const parentUser = await createTestUser(tx, {
        name: "Summary Parent",
        email: `summary-${randomUUID()}@test.com`,
      });
      const parent = await createTestParent(tx, parentUser.id);

      const laterUnpaid = await createOverdueInvoice(tx, parent.id, "200.00", 20, InvoiceStatus.UNPAID);
      const earlierUnpaid = await createOverdueInvoice(tx, parent.id, "100.00", 5, InvoiceStatus.UNPAID);
      await createOverdueInvoice(tx, parent.id, "50.00", -2, InvoiceStatus.PAYMENT_PENDING);

      const result = await BillingRepository.getParentBillingSummary(parent.id, tx);

      expect(result.nextUnpaidInvoice?.id).toBe(earlierUnpaid.id);
      expect(result.nextUnpaidInvoice?.amount).toBe("100.00");
      expect(result.nextUnpaidInvoice?.dueDate).toBe(earlierUnpaid.dueDate);
      expect(result.pendingPaymentCount).toBe(1);
      expect(result.outstandingBalance).toBe("300.00");
      expect(result.nextDueDate).toBe(earlierUnpaid.dueDate);
      expect(laterUnpaid.id).not.toBe(result.nextUnpaidInvoice?.id);
    });
  });

  test("returns null next unpaid invoice when parent has no unpaid invoices", async () => {
    await runInRollback(async tx => {
      const parentUser = await createTestUser(tx, {
        name: "Summary Paid Parent",
        email: `summary-paid-${randomUUID()}@test.com`,
      });
      const parent = await createTestParent(tx, parentUser.id);

      await createOverdueInvoice(tx, parent.id, "100.00", -5, InvoiceStatus.PAID);

      const result = await BillingRepository.getParentBillingSummary(parent.id, tx);

      expect(result.nextUnpaidInvoice).toBeNull();
      expect(result.pendingPaymentCount).toBe(0);
    });
  });
});

describe("BillingRepository — invoice search", () => {
  test("filters parent invoices by id fragment server-side", async () => {
    await runInRollback(async tx => {
      const parentUser = await createTestUser(tx, {
        name: "Search Parent",
        email: `search-${randomUUID()}@test.com`,
      });
      const parent = await createTestParent(tx, parentUser.id);

      const target = await createOverdueInvoice(tx, parent.id, "111.00", -3, InvoiceStatus.UNPAID);
      await createOverdueInvoice(tx, parent.id, "222.00", -4, InvoiceStatus.UNPAID);

      const result = await BillingRepository.getInvoicesForParent(parent.id, null, target.id.slice(0, 8), tx);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.id).toBe(target.id);
    });
  });
});
