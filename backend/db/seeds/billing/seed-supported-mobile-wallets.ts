import { MOBILE_WALLET_CATALOG_SEEDS } from "@/backend/db/seeds/lib/payment-catalog-factory";
import logger from "@/backend/lib/logger";
import { PaymentCatalogService } from "@/backend/services/payment-method/payment-catalog.service";

export async function seedOrGet() {
  logger.info("Seeding supported mobile wallets...");
  const now = new Date();

  const inputs = MOBILE_WALLET_CATALOG_SEEDS.map(spec => ({
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
  }));

  const results = await PaymentCatalogService.upsertManyMobileWallets(inputs);
  logger.info(`Supported mobile wallets seeded (${results.length} rows).`);
  return results;
}
