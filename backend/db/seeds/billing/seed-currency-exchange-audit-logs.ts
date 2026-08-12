import { findAdminUser, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { FxIngestionService } from "@/backend/services";
import type { ExchangeAuditLogInput, UserSelectType } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

type ExchangeRateRow = {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: string;
  createdAt: Date;
};

export async function seedOrGet(ratesList: ExchangeRateRow[], usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding currency exchange audit logs...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling || !ratesList?.length) {
    return [];
  }

  const adminUser = findAdminUser(usersList);
  const ratesToSeed = ratesList.slice(0, seedConfig.profile === "standard" ? ratesList.length : 3);
  const inputs: ExchangeAuditLogInput[] = ratesToSeed.map(rate => ({
    fromCurrency: rate.fromCurrency,
    toCurrency: rate.toCurrency,
    oldRate: null,
    newRate: rate.rate,
    source: "seed",
    changedByUserId: adminUser?.id ?? null,
    createdAt: rate.createdAt,
  }));

  const results = await FxIngestionService.createManyExchangeAuditLogs(inputs);
  logger.info(`Currency exchange audit logs seeded (${results.length} rows).`);
  return results;
}
