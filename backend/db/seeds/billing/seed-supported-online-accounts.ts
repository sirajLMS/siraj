import { seedCatalogLogoUrls } from "@/backend/db/seeds/lib/logo-seed-helper";
import {
  ONLINE_ACCOUNT_CATALOG_SEEDS,
  type OnlineAccountCatalogSeed,
} from "@/backend/db/seeds/lib/payment-catalog-factory";
import logger from "@/backend/lib/logger";
import { PaymentCatalogService } from "@/backend/services/payment-method/payment-catalog.service";
import { getServerTranslations } from "@/shared/locale";

export async function seedOrGet() {
  logger.info("Seeding supported online accounts...");
  const now = new Date();
  const slugs = ONLINE_ACCOUNT_CATALOG_SEEDS.map((spec: OnlineAccountCatalogSeed) => spec.slug);
  const logoUrls = await seedCatalogLogoUrls("payment", slugs);

  const inputs = ONLINE_ACCOUNT_CATALOG_SEEDS.map((spec: OnlineAccountCatalogSeed) => ({
    slug: spec.slug,
    name: spec.name,
    description: spec.description,
    instructions: spec.instructions,
    identifierKind: spec.identifierKind,
    identifierLabel: spec.identifierLabel,
    supportedDirections: spec.supportedDirections,
    logoUrl: logoUrls.get(spec.slug) ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  const tErrors = getServerTranslations("en").errorsTranslations;
  const results = await PaymentCatalogService.upsertManyOnlineAccounts(inputs, tErrors);
  logger.info(`Supported online accounts seeded (${results.length} rows).`);
  return results;
}
