import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { currencyHedges } from "@/backend/db/schema/billing";
import logger from "@/backend/lib/logger";
import { loadSeedConfig, type SeedConfig } from "./lib";

const HEDGE_SPECS = [
  { currency: "USD", amount: "10000.00", hedgeType: "LONG", notes: "USD exposure hedge" },
  { currency: "EGP", amount: "250000.00", hedgeType: "SHORT", notes: "EGP exposure hedge" },
  { currency: "SAR", amount: "50000.00", hedgeType: "LONG", notes: "SAR exposure hedge" },
] as const;

export async function seedOrGet(config?: SeedConfig) {
  logger.info("Seeding currency hedges...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableBilling) {
    return [];
  }

  const results = [];
  const specs = seedConfig.profile === "standard" ? HEDGE_SPECS : HEDGE_SPECS.slice(0, 1);

  for (const spec of specs) {
    const [existing] = await db
      .select()
      .from(currencyHedges)
      .where(eq(currencyHedges.currency, spec.currency))
      .limit(1);

    if (existing) {
      results.push(existing);
      continue;
    }

    const [inserted] = await db
      .insert(currencyHedges)
      .values({
        currency: spec.currency,
        amount: spec.amount,
        hedgeType: spec.hedgeType,
        notes: spec.notes,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Currency hedges seeded (${results.length} rows).`);
  return results;
}
