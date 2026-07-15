import { seedCatalogLogoUrls } from "@/backend/db/seeds/lib/logo-seed-helper";
import { MOBILE_WALLET_CATALOG_SEEDS } from "@/backend/db/seeds/lib/payment-catalog-factory";
import logger from "@/backend/lib/logger";
import { PaymentCatalogService } from "@/backend/services/payment-method/payment-catalog.service";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export async function seedOrGet() {
  logger.info("Seeding supported mobile wallets...");
  const now = new Date();
  const slugs = MOBILE_WALLET_CATALOG_SEEDS.map(spec => spec.slug);
  const logoUrls = await seedCatalogLogoUrls("payment", slugs);

  const inputs = MOBILE_WALLET_CATALOG_SEEDS.map(spec => ({
    slug: spec.slug,
    name: spec.name,
    description: spec.description,
    instructions: spec.instructions,
    countryCode: spec.countryCode,
    currencyCode: spec.currencyCode,
    phoneRegion: spec.phoneRegion,
    supportedDirections: spec.supportedDirections,
    logoUrl: logoUrls.get(spec.slug) ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  const tErrors = await getServerTranslations("en", "errors");
  const results = await PaymentCatalogService.upsertManyMobileWallets(inputs, tErrors);
  logger.info(`Supported mobile wallets seeded (${results.length} rows).`);
  return results;
}
