import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { SupportedCurrencyRepository } from "@/backend/db/repo";
import { supportedCurrencies, users } from "@/backend/db/schema";
import { runInRollback } from "@/backend/db/test/test-utils";
import { CurrencyCode, IanaTimezone } from "@/backend/enum";

/**
 * All 32 CurrencyCode enum values are seeded into `supported_currencies` by
 * `backend/db/seeds/billing/seed-currencies.ts`. Tests therefore operate on
 * existing seed rows rather than inserting new ones (the table's PK is the
 * currency code, so inserting a seeded code violates the unique constraint).
 *
 * `DJF` (Djiboutian Franc) is chosen as the test currency because it is
 * unlikely to be referenced by other tables in the test database (no invoices,
 * payments, etc. use it by default), making it a safe target for
 * activate/deactivate and in-use checks.
 */
const TEST_CURRENCY = CurrencyCode.DJF;

describe("SupportedCurrencyRepository — deactivateByCode", () => {
  test("flips isActive from true to false and returns the updated row", async () => {
    await runInRollback(async tx => {
      // Arrange — ensure the seed row is active before the test.
      await tx.update(supportedCurrencies).set({ isActive: true }).where(eq(supportedCurrencies.code, TEST_CURRENCY));

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
      // Arrange — force the row inactive first.
      await tx.update(supportedCurrencies).set({ isActive: false }).where(eq(supportedCurrencies.code, TEST_CURRENCY));

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
      // Arrange — DJF is seeded but nothing references it by default.
      // (If the test DB happens to have a reference, this test would surface
      // it as a failure, which is the intended behavior.)

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
