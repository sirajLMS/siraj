import { describe, expect, test } from "bun:test";
import type { DBTransaction } from "@/backend/db/db.types";
import { BillingRepository } from "@/backend/db/repo";
import { currencyExchangeRates } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode } from "@/backend/enum";
import { FxDisplayService } from "@/backend/services/billing/fx-display.service";

describe("FxDisplayService", () => {
  test("convertForDisplay returns identity when locked equals display currency", async () => {
    const result = await FxDisplayService.convertForDisplay("50.00", CurrencyCode.EGP, CurrencyCode.EGP, "entity-1");
    expect(result).toEqual({
      id: "displayAmount:entity-1:EGP",
      amount: "50.00",
      currency: CurrencyCode.EGP,
      stale: false,
    });
  });

  test("convertForDisplay returns null when display currency is missing", async () => {
    const result = await FxDisplayService.convertForDisplay("50.00", CurrencyCode.EGP, null, "entity-1");
    expect(result).toBeNull();
  });

  test("convertForDisplay uses live direct FX pair", async () => {
    await runInRollback(async (tx: DBTransaction) => {
      const now = new Date();
      await tx.insert(currencyExchangeRates).values({
        fromCurrency: CurrencyCode.EGP,
        toCurrency: CurrencyCode.USD,
        rate: "0.032000",
        source: "TEST",
        effectiveDate: now,
        createdAt: now,
        updatedAt: now,
      });

      const result = await FxDisplayService.convertForDisplay(
        "100.00",
        CurrencyCode.EGP,
        CurrencyCode.USD,
        "entity-2",
        tx
      );

      expect(result?.stale).toBe(false);
      expect(result?.currency).toBe(CurrencyCode.USD);
      expect(result?.amount).toBe("3.20");
    });
  });

  test("convertForDisplay marks stale when direct FX is older than 24h", async () => {
    await runInRollback(async (tx: DBTransaction) => {
      const existing = await BillingRepository.getLatestExchangeRateForDisplay(CurrencyCode.EGP, CurrencyCode.USD, tx);

      const staleDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await tx.insert(currencyExchangeRates).values({
        fromCurrency: CurrencyCode.EGP,
        toCurrency: CurrencyCode.USD,
        rate: "0.032000",
        source: "TEST",
        effectiveDate: staleDate,
        createdAt: staleDate,
        updatedAt: staleDate,
      });

      const result = await FxDisplayService.convertForDisplay(
        "100.00",
        CurrencyCode.EGP,
        CurrencyCode.USD,
        "entity-3",
        tx
      );

      if (existing.rate && !existing.stale) {
        expect(result?.stale).toBe(false);
        expect(result?.amount).toBeDefined();
      } else {
        expect(result).toEqual({
          id: "displayAmount:entity-3:USD",
          amount: null,
          currency: CurrencyCode.USD,
          stale: true,
        });
      }
    });
  });

  test("convertForDisplay uses USD-hub transitive path", async () => {
    await runInRollback(async (tx: DBTransaction) => {
      const now = new Date();
      await tx.insert(currencyExchangeRates).values({
        fromCurrency: CurrencyCode.EGP,
        toCurrency: CurrencyCode.USD,
        rate: "0.032000",
        source: "TEST",
        effectiveDate: now,
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(currencyExchangeRates).values({
        fromCurrency: CurrencyCode.USD,
        toCurrency: CurrencyCode.SAR,
        rate: "3.750000",
        source: "TEST",
        effectiveDate: now,
        createdAt: now,
        updatedAt: now,
      });

      const direct = await BillingRepository.getLatestExchangeRateForDisplay(CurrencyCode.EGP, CurrencyCode.SAR, tx);
      expect(direct.stale).toBe(true);

      const result = await FxDisplayService.convertForDisplay(
        "100.00",
        CurrencyCode.EGP,
        CurrencyCode.SAR,
        "entity-4",
        tx
      );

      expect(result?.stale).toBe(false);
      expect(result?.currency).toBe(CurrencyCode.SAR);
      expect(result?.amount).toBe("12.00");
    });
  });
});
