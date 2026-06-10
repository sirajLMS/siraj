import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { testLogger } from "../../../lib/testlogger";
import type * as Types from "../../types";
import { db } from "../drizzleDb";
import { BillingRepository } from "../repo";
import { currencyExchangeAuditLogs, currencyExchangeRates, invoices, parents, systemSettings, users } from "../schema";

describe("Billing Safeguards & Exchange Rates", () => {
  let testUser: Types.UserEntity;
  let testParent: Types.ParentEntity;

  beforeAll(async () => {
    testLogger.info("Setting up billing test data...");

    // Create an admin user for audit logs
    const userResults = await db
      .insert(users)
      .values({
        name: "Billing Admin",
        email: `admin-${randomUUID()}@example.com`,
        password: "password",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testUser = userResults[0];

    // Create a parent for invoicing
    const parentUserResults = await db
      .insert(users)
      .values({
        name: "Parent X",
        email: `parent-${randomUUID()}@example.com`,
        password: "password",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    const parentUser = parentUserResults[0];

    const parentResults = await db
      .insert(parents)
      .values({
        userId: parentUser.id,
        status: "REGULAR",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testParent = parentResults[0];

    // Seed rounding rule
    await db
      .insert(systemSettings)
      .values({
        key: "billing_rounding_decimals",
        value: "2",
        dataType: "number",
        description: "Decimals for billing rounding",
        category: "FINANCE",
        updatedByUserId: testUser.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: "2", updatedAt: new Date() },
      });
  });

  afterAll(async () => {
    testLogger.info("Cleaning up billing test data...");
    try {
      if (typeof testParent !== "undefined") {
        // Hard delete invoices for this parent
        await db.update(invoices).set({ deletedAt: new Date() }).where(eq(invoices.parentId, testParent.id));
        await db.delete(invoices).where(eq(invoices.parentId, testParent.id));

        // Hard delete the parent
        await db.delete(parents).where(eq(parents.id, testParent.id));
      }

      // Delete exchange rates and audit logs created during tests (using testUser.id for audit logs)
      if (typeof testUser !== "undefined") {
        await db.delete(currencyExchangeAuditLogs).where(eq(currencyExchangeAuditLogs.changedByUserId, testUser.id));
      }
      await db.delete(currencyExchangeRates).where(sql`source IN ('TEST_API', 'TEST_SNAPSHOT_API') OR (from_currency = 'GBP' AND to_currency = 'USD')`);

      // Delete users explicitly by ID
      const userIdsToDelete = [];
      if (typeof testUser !== "undefined") userIdsToDelete.push(testUser.id);
      if (typeof testParent !== "undefined") userIdsToDelete.push(testParent.userId);
      
      if (userIdsToDelete.length > 0) {
        await db.delete(users).where(sql`id IN ${userIdsToDelete}`);
      }

      testLogger.info("Cleanup successful.");
    } catch (err) {
      testLogger.error("Error during cleanup:", err);
    }
  });

  test("Exchange rate update creates audit log entry", async () => {
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
      testUser.id
    );

    expect(newRate.rate).toBe(rateValue);

    const [auditLog] = await db
      .select()
      .from(currencyExchangeAuditLogs)
      .where(eq(currencyExchangeAuditLogs.newRate, rateValue))
      .orderBy(desc(currencyExchangeAuditLogs.createdAt))
      .limit(1);

    expect(auditLog).toBeDefined();
    expect(auditLog.fromCurrency).toBe(from);
    expect(auditLog.source).toBe("TEST_API");
    expect(auditLog.changedByUserId).toBe(testUser.id);

    testLogger.info("Exchange rate audit log verified.");
  });

  test("Stale rate detection throws error after 24 hours", async () => {
    const from = "GBP";
    const to = "USD";
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

    await db.insert(currencyExchangeRates).values({
      fromCurrency: from,
      toCurrency: to,
      rate: "1.250000",
      effectiveDate: staleDate,
      createdAt: staleDate,
      updatedAt: staleDate,
    });

    let didThrow = false;
    try {
      await BillingRepository.getLatestExchangeRate(from, to);
    } catch (e) {
      didThrow = true;
      if (e instanceof Error) {
        expect(e.message).toContain("stale");
      }
    }
    expect(didThrow).toBe(true);

    testLogger.info("Stale rate detection verified.");
  });

  test("Invoices automatically snapshot exchange rate when currency is not USD", async () => {
    const from = "EUR";
    const to = "USD";
    const rateValue = "1.080000";

    // Insert a fresh rate
    await db.insert(currencyExchangeRates).values({
      fromCurrency: from,
      toCurrency: to,
      rate: rateValue,
      effectiveDate: new Date(),
      source: "TEST_SNAPSHOT_API",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const invoice = await BillingRepository.createInvoice({
      parentId: testParent.id,
      issueDate: "2026-06-10",
      dueDate: "2026-06-20",
      amount: "100.00",
      currency: from,
      status: "UNPAID",
      invoiceType: "MONTHLY",
      idempotencyKey: randomUUID(),
    });

    expect(invoice.exchangeRateSnapshot).toBe(rateValue);
    expect(invoice.exchangeRateSource).toBe("TEST_SNAPSHOT_API");

    testLogger.info("Invoice exchange rate snapshot verified.");
  });

  test("Invoice rounding rules are fetched correctly", async () => {
    const decimals = await BillingRepository.getRoundingRules();
    expect(decimals).toBe(2);
    testLogger.info("Rounding rules verified.");
  });
});
