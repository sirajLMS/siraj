import { seedCatalogLogoUrls } from "@/backend/db/seeds/lib/logo-seed-helper";
import {
  PAYMENT_LINK_CATALOG_SEEDS,
  type PaymentLinkCatalogSeed,
} from "@/backend/db/seeds/lib/payment-catalog-factory";
import logger from "@/backend/lib/logger";
import { PaymentCatalogService } from "@/backend/services/payment-method/payment-catalog.service";
import { getServerTranslations } from "@/shared/locale";

export async function seedOrGet() {
  logger.info("Seeding supported payment links...");
  const now = new Date();
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
    createdAt: now,
    updatedAt: now,
  }));

  const tErrors = getServerTranslations("en").errorsTranslations;
  const results = await PaymentCatalogService.upsertManyPaymentLinks(inputs, tErrors);
  logger.info(`Supported payment links seeded (${results.length} rows).`);
  return results;
}
