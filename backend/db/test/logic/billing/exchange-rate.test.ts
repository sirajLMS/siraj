import { describe, expect, test } from "bun:test";
import { currencyExchangeRates } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode } from "@/backend/enum";
import type { CurrencyExchangeRateInsertType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

describe("Currency Exchange Rates", () => {
  test("Composite unique constraint prevents duplicate rates for same effective date", async () => {
    testLogger.info("Starting currency exchange rate unique constraint test...");
    await runInRollback(async tx => {
      const now = new Date();
      // Use integer hour/date to avoid floating millisecond differences
      const effectiveDate = new Date(Date.UTC(2026, 5, 9, 12, 0, 0));

      const exchangeRateInput1: CurrencyExchangeRateInsertType = {
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.EUR,
        rate: "0.920000",
        effectiveDate,
        createdAt: now,
        updatedAt: now,
      };

      const exchangeRateInput2: CurrencyExchangeRateInsertType = {
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.EUR,
        rate: "0.930000",
        effectiveDate,
        createdAt: now,
        updatedAt: now,
      };

      // First insert should succeed
      const [rate1] = await tx.insert(currencyExchangeRates).values(exchangeRateInput1).returning();
      expect(rate1).toBeDefined();

      // Second insert with same from, to, and effectiveDate should throw a unique key constraint error
      let didThrow = false;
      try {
        await tx.insert(currencyExchangeRates).values(exchangeRateInput2);
      } catch (error) {
        didThrow = true;
        testLogger.info(`Caught expected error: ${error}`);
        // The insert failed, which is what we expect - the unique constraint is working
      }
      expect(didThrow).toBe(true);

      testLogger.info("Successfully verified composite unique constraint on exchange rates.");
    });
  });
});
