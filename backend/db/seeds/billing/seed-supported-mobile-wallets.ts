import { db } from "@/backend/db/drizzleDb";
import { supportedMobileWallets } from "@/backend/db/schema";
import { MOBILE_WALLET_CATALOG_SEEDS } from "@/backend/db/seeds/lib/payment-catalog-factory";
import logger from "@/backend/lib/logger";

export async function seedOrGet() {
  logger.info("Seeding supported mobile wallets...");
  const now = new Date();
  const results = [];

  for (const spec of MOBILE_WALLET_CATALOG_SEEDS) {
    const [row] = await db
      .insert(supportedMobileWallets)
      .values({
        slug: spec.slug,
        name: spec.name,
        description: spec.description,
        instructions: spec.instructions,
        countryCode: spec.countryCode,
        currencyCode: spec.currencyCode,
        phoneRegion: spec.phoneRegion,
        supportedDirections: spec.supportedDirections,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: supportedMobileWallets.slug,
        set: {
          name: spec.name,
          description: spec.description,
          instructions: spec.instructions,
          countryCode: spec.countryCode,
          currencyCode: spec.currencyCode,
          phoneRegion: spec.phoneRegion,
          supportedDirections: spec.supportedDirections,
          isActive: true,
          updatedAt: now,
        },
      })
      .returning();

    results.push(row);
  }

  logger.info(`Supported mobile wallets seeded (${results.length} rows).`);
  return results;
}
