import { db } from "@/backend/db/drizzleDb";
import { currencyExchangeRates } from "@/backend/db/schema/billing";
import { EXCHANGE_PAIRS, iterateInvoiceMonths, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";

export async function seedOrGet(config?: SeedConfig) {
  logger.info("Seeding currency exchange rates...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling) {
    return [];
  }

  const results = [];
  const months = [...iterateInvoiceMonths(seedConfig)];

  for (const pair of EXCHANGE_PAIRS) {
    for (const monthSpec of months.slice(0, seedConfig.profile === "standard" ? months.length : 1)) {
      const effectiveDate = new Date(`${monthSpec.issueDate}T00:00:00.000Z`);

      const [inserted] = await db
        .insert(currencyExchangeRates)
        .values({
          fromCurrency: pair.from,
          toCurrency: pair.to,
          rate: pair.baseRate,
          source: "seed",
          effectiveDate,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            currencyExchangeRates.fromCurrency,
            currencyExchangeRates.toCurrency,
            currencyExchangeRates.effectiveDate,
          ],
          set: { rate: pair.baseRate, updatedAt: now },
        })
        .returning();
      results.push(inserted);
    }
  }

  logger.info(`Currency exchange rates seeded (${results.length} rows).`);
  return results;
}
