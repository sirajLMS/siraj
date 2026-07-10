import { db } from "@/backend/db/drizzleDb";
import { currencyExchangeAuditLogs } from "@/backend/db/schema/billing/billing";
import { findAdminUser, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import type { UserSelectType } from "@/backend/types";

type ExchangeRateRow = { fromCurrency: string; toCurrency: string; rate: string; createdAt: Date };

export async function seedOrGet(ratesList: ExchangeRateRow[], usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding currency exchange audit logs...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling || !ratesList?.length) {
    return [];
  }

  const adminUser = findAdminUser(usersList);
  const results = [];

  for (const rate of ratesList.slice(0, seedConfig.profile === "standard" ? ratesList.length : 3)) {
    const [inserted] = await db
      .insert(currencyExchangeAuditLogs)
      .values({
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        oldRate: null,
        newRate: rate.rate,
        source: "seed",
        changedByUserId: adminUser?.id ?? null,
        createdAt: rate.createdAt,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Currency exchange audit logs seeded (${results.length} rows).`);
  return results;
}
