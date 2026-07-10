import { PAYMENT_LINK_CATALOG_SEEDS } from "@/backend/db/seeds/lib/payment-catalog-factory";
import logger from "@/backend/lib/logger";
import { PaymentCatalogService } from "@/backend/services/payment-method/payment-catalog.service";

export async function seedOrGet() {
  logger.info("Seeding supported payment links...");
  const now = new Date();

  const inputs = PAYMENT_LINK_CATALOG_SEEDS.map(spec => ({
    slug: spec.slug,
    name: spec.name,
    description: spec.description,
    instructions: spec.instructions,
    urlAllowlist: spec.urlAllowlist,
    urlExample: spec.urlExample,
    supportedDirections: spec.supportedDirections,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  const results = await PaymentCatalogService.upsertManyPaymentLinks(inputs);
  logger.info(`Supported payment links seeded (${results.length} rows).`);
  return results;
}
