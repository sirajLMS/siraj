import { EXCHANGE_PAIRS, iterateInvoiceMonths, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { FxIngestionService } from "@/backend/services";
import type { CurrencyExchangeRateSubmitInput } from "@/backend/types";

export async function seedOrGet(config?: SeedConfig) {
  logger.info("Seeding currency exchange rates...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling) {
    return [];
  }

  const months = [...iterateInvoiceMonths(seedConfig)];
  const inputs: CurrencyExchangeRateSubmitInput[] = [];

  for (const pair of EXCHANGE_PAIRS) {
    for (const monthSpec of months.slice(0, seedConfig.profile === "standard" ? months.length : 1)) {
      inputs.push({
        fromCurrency: pair.from,
        toCurrency: pair.to,
        rate: pair.baseRate,
        source: "seed",
        effectiveDate: new Date(`${monthSpec.issueDate}T00:00:00.000Z`),
      });
    }
  }

  const results = await FxIngestionService.upsertManyExchangeRates(inputs);
  logger.info(`Currency exchange rates seeded (${results.length} rows).`);
  return results;
}
