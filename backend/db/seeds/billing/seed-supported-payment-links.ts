import { PAYMENT_LINK_CATALOG_SEEDS, type PaymentLinkCatalogSeed, seedCatalogLogoUrls } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { PaymentCatalogService } from "@/backend/services";
import { getServerTranslations } from "@/shared/locale";

export async function seedOrGet() {
  logger.info("Seeding supported payment links...");
  const slugs = PAYMENT_LINK_CATALOG_SEEDS.map((spec: PaymentLinkCatalogSeed) => spec.slug);
  const logoUrls = await seedCatalogLogoUrls("payment", slugs);

  const inputs = PAYMENT_LINK_CATALOG_SEEDS.map((spec: PaymentLinkCatalogSeed) => ({
    slug: spec.slug,
    name: spec.name,
    description: spec.description,
    instructions: spec.instructions,
    urlAllowlist: spec.urlAllowlist,
    urlExample: spec.urlExample,
    supportedDirections: spec.supportedDirections,
    logoUrl: logoUrls.get(spec.slug) ?? null,
    isActive: true,
  }));

  const tErrors = getServerTranslations("en").errorsTranslations;
  const results = await PaymentCatalogService.upsertManyPaymentLinks(inputs, tErrors);
  logger.info(`Supported payment links seeded (${results.length} rows).`);
  return results;
}
