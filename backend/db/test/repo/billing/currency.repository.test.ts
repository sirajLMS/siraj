import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/types";
import { SupportedCurrencyRepository } from "@/backend/db/repo/billing";
import { supportedCurrencies, users } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { SupportedCurrencyReturnType } from "@/backend/types/billing/currency.types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

/** Unlikely to be referenced by other tables, so safe for activate/deactivate checks. */
const TEST_CURRENCY = CurrencyCode.DJF;

async function ensureTestCurrency(tx: DBTransaction, isActive: boolean): Promise<SupportedCurrencyReturnType> {
  const [currency] = await SupportedCurrencyRepository.upsertMany(
    [{ code: TEST_CURRENCY, symbol: "Fdj", isActive }],
    tx
  );
  if (!currency) {
    throw new Error(`Failed to create test currency ${TEST_CURRENCY}`);
  }
  return currency;
}

describe("SupportedCurrencyRepository — deactivateByCode", () => {
  test("flips isActive from true to false and returns the updated row", async () => {
    await runInRollback(async tx => {
      // Arrange — create an active currency row for this test.
      await ensureTestCurrency(tx, true);

      // Act — deactivate it.
      const result = await SupportedCurrencyRepository.deactivateByCode(TEST_CURRENCY, tx);

      // Assert — repository reports the deactivation.
      expect(result).not.toBeNull();
      expect(result?.code).toBe(TEST_CURRENCY);
      expect(result?.isActive).toBe(false);

      // Assert — the row is persisted with isActive=false.
      const [persisted] = await tx
        .select()
        .from(supportedCurrencies)
        .where(eq(supportedCurrencies.code, TEST_CURRENCY))
        .limit(1);
      expect(persisted).toBeDefined();
      expect(persisted?.isActive).toBe(false);
    });
  });

  test("is idempotent — deactivating an already-inactive row stays inactive", async () => {
    await runInRollback(async tx => {
      // Arrange — create an inactive currency row for this test.
      await ensureTestCurrency(tx, false);

      // Act — deactivate again.
      const result = await SupportedCurrencyRepository.deactivateByCode(TEST_CURRENCY, tx);

      // Assert — still inactive, still returned.
      expect(result).not.toBeNull();
      expect(result?.isActive).toBe(false);
    });
  });
});

describe("SupportedCurrencyRepository — isCurrencyInUse", () => {
  test("returns false when no referencing table contains the code", async () => {
    await runInRollback(async tx => {
      // Arrange — create the currency row; nothing references it in this test.
      await ensureTestCurrency(tx, true);

      // Act
      const inUse = await SupportedCurrencyRepository.isCurrencyInUse(TEST_CURRENCY, tx);

      // Assert — nothing references DJF, so it is not in use.
      expect(inUse).toBe(false);
    });
  });

  test("returns true when a user has displayCurrency set to the code", async () => {
    await runInRollback(async tx => {
      // Arrange — create a user whose displayCurrency is the test code. This
      // is the lightest-weight referencing table (no required foreign
      // relations), so it is the cheapest way to prove the UNION ALL guard
      // fires on at least one branch.
      const now = new Date();
      await tx.insert(users).values({
        name: "Currency User",
        email: `currency-${now.getTime()}@example.com`,
        password: "password",
        timezone: IanaTimezone.UTC,
        displayCurrency: TEST_CURRENCY,
        createdAt: now,
        updatedAt: now,
      });

      // Act
      const inUse = await SupportedCurrencyRepository.isCurrencyInUse(TEST_CURRENCY, tx);

      // Assert — the users table references the test currency, so it is in use.
      expect(inUse).toBe(true);
    });
  });
});
