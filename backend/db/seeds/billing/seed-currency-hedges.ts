import { loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { orchestrateSeedMany } from "@/backend/db/seeds/lib/orchestrate-seed-many";
import { CurrencyCode } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { CurrencyHedgeService } from "@/backend/services/fx/currency-hedge.service";
import type { CurrencyHedgeSelectType } from "@/backend/types";

const HEDGE_SPECS = [
  { currency: CurrencyCode.USD, amount: "10000.00", hedgeType: "LONG", notes: "USD exposure hedge" },
  { currency: CurrencyCode.EGP, amount: "250000.00", hedgeType: "SHORT", notes: "EGP exposure hedge" },
  { currency: CurrencyCode.SAR, amount: "50000.00", hedgeType: "LONG", notes: "SAR exposure hedge" },
] as const;

export async function seedOrGet(config?: SeedConfig) {
  logger.info("Seeding currency hedges...");

  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling) {
    return [];
  }

  const specs = seedConfig.profile === "standard" ? HEDGE_SPECS : HEDGE_SPECS.slice(0, 1);

  const results = await orchestrateSeedMany({
    specs: [...specs],
    toKey: spec => spec.currency,
    findExisting: async currencies => {
      const existing = await CurrencyHedgeService.findHedgesByCurrencies(currencies);
      return new Map(
        existing.map(row => [row.currency, row] as [(typeof currencies)[number], CurrencyHedgeSelectType])
      );
    },
    createMany: async toCreate =>
      CurrencyHedgeService.createManyHedges(
        toCreate.map(spec => ({
          currency: spec.currency,
          amount: spec.amount,
          hedgeType: spec.hedgeType,
          notes: spec.notes,
        }))
      ),
    refetchOnRace: async currencies => {
      const existing = await CurrencyHedgeService.findHedgesByCurrencies(currencies);
      return new Map(
        existing.map(row => [row.currency, row] as [(typeof currencies)[number], CurrencyHedgeSelectType])
      );
    },
  });

  logger.info(`Currency hedges seeded (${results.length} rows).`);
  return results;
}
