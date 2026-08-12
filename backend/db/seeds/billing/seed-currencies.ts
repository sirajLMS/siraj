import { toSupportedCurrencyUpsertInputs } from "@/backend/db/seeds/lib/currency-catalog-factory";
import { logger } from "@/backend/lib/logger";
import { CurrencyCatalogService } from "@/backend/services";

export async function seedOrGet() {
  logger.info("Seeding supported currencies...");
  const results = await CurrencyCatalogService.upsertManyForSeed(toSupportedCurrencyUpsertInputs());
  logger.info(`Supported currencies seeded (${results.length} rows).`);
  return results;
}
