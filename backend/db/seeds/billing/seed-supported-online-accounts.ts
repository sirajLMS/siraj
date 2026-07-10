import { ONLINE_ACCOUNT_CATALOG_SEEDS } from "@/backend/db/seeds/lib/payment-catalog-factory";
import logger from "@/backend/lib/logger";
import { PaymentCatalogService } from "@/backend/services/payment-method/payment-catalog.service";

export async function seedOrGet() {
  logger.info("Seeding supported online accounts...");
  const now = new Date();

  const inputs = ONLINE_ACCOUNT_CATALOG_SEEDS.map(spec => ({
    slug: spec.slug,
    name: spec.name,
    description: spec.description,
    instructions: spec.instructions,
    identifierKind: spec.identifierKind,
    identifierLabel: spec.identifierLabel,
    supportedDirections: spec.supportedDirections,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));

  const results = await PaymentCatalogService.upsertManyOnlineAccounts(inputs);
  logger.info(`Supported online accounts seeded (${results.length} rows).`);
  return results;
}
