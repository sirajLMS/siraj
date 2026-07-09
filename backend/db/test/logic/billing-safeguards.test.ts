import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { BillingRepository } from "@/backend/db/repo";
import { currencyExchangeAuditLogs, currencyExchangeRates, systemSettings } from "@/backend/db/schema";
import { testLogger } from "@/shared/lib/logger/testlogger";
import { createTestParent, createTestUser } from "../entity-setup";
import { runInRollback } from "../test-utils";

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

async function setupBillingTestEntities(tx: DBTransaction) {
  const adminUser = await createTestUser(tx, { name: "Billing Admin" });
  const parentUser = await createTestUser(tx, { name: "Billing Parent" });
  const parent = await createTestParent(tx, parentUser.id);

  const now = new Date();
  await tx
    .insert(systemSettings)
    .values({
      key: "billing_rounding_decimals",
      value: "2",
      dataType: "number",
      description: "Decimals for billing rounding",
      category: "FINANCE",
      updatedByUserId: adminUser.id,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: "2", updatedAt: now },
    });

  return { adminUser, parentUser, parent };
}

describe("Billing Safeguards & Exchange Rates", () => {
  test("Exchange rate update creates audit log entry", async () => {
    await runInRollback(async tx => {
      const { adminUser } = await setupBillingTestEntities(tx);

      const from = "EGP";
      const to = "USD";
      const rateValue = "50.000000";

      const newRate = await BillingRepository.updateExchangeRate(
        {
          fromCurrency: from,
          toCurrency: to,
          rate: rateValue,
          source: "TEST_API",
          effectiveDate: new Date(),
        },
        adminUser.id,
        tx
      );

      expect(newRate.rate).toBe(rateValue);

      const [auditLog] = await tx
        .select()
        .from(currencyExchangeAuditLogs)
        .where(eq(currencyExchangeAuditLogs.newRate, rateValue))
        .orderBy(desc(currencyExchangeAuditLogs.createdAt))
        .limit(1);

      expect(auditLog).toBeDefined();
      expect(auditLog.fromCurrency).toBe(from);
      expect(auditLog.source).toBe("TEST_API");
      expect(auditLog.changedByUserId).toBe(adminUser.id);

      testLogger.info("Exchange rate audit log verified.");
    });
  });

  test("Stale rate detection throws error after 24 hours", async () => {
    await runInRollback(async tx => {
      const from = "GBP";
      const to = "USD";
      const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

      await tx.insert(currencyExchangeRates).values({
        fromCurrency: from,
        toCurrency: to,
        rate: "1.250000",
        effectiveDate: staleDate,
        createdAt: staleDate,
        updatedAt: staleDate,
      });

      const error = await expectRepoError(() => BillingRepository.getLatestExchangeRate(from, to, tx));
      expect(error.message).toContain("stale");

      testLogger.info("Stale rate detection verified.");
    });
  });

  test("Invoices automatically snapshot exchange rate when currency is not USD", async () => {
    await runInRollback(async tx => {
      const { parent } = await setupBillingTestEntities(tx);

      const from = "EUR";
      const to = "USD";
      const rateValue = "1.080000";

      const now = new Date();
      await tx.insert(currencyExchangeRates).values({
        fromCurrency: from,
        toCurrency: to,
        rate: rateValue,
        effectiveDate: now,
        source: "TEST_SNAPSHOT_API",
        createdAt: now,
        updatedAt: now,
      });

      const invoice = await BillingRepository.createInvoice(
        {
          parentId: parent.id,
          issueDate: "2026-06-10",
          dueDate: "2026-06-20",
          amount: "100.00",
          currency: from,
          status: "UNPAID",
          invoiceType: "MONTHLY",
          idempotencyKey: randomUUID(),
        },
        tx
      );

      expect(invoice.exchangeRateSnapshot).toBe(rateValue);
      expect(invoice.exchangeRateSource).toBe("TEST_SNAPSHOT_API");

      testLogger.info("Invoice exchange rate snapshot verified.");
    });
  });

  test("Invoice rounding rules are fetched correctly", async () => {
    await runInRollback(async tx => {
      await setupBillingTestEntities(tx);

      const decimals = await BillingRepository.getRoundingRules(tx);
      expect(decimals).toBe(2);
      testLogger.info("Rounding rules verified.");
    });
  });
});
