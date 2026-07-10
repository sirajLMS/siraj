import { MEETING_PROVIDER_CATALOG_SEEDS } from "@/backend/db/seeds/lib/meeting-provider-factory";
import logger from "@/backend/lib/logger";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";

export async function seedOrGet() {
  logger.info("Seeding meeting providers...");

  const results = await MeetingProviderCatalogService.upsertManyProviders(
    MEETING_PROVIDER_CATALOG_SEEDS.map(spec => ({
      ...spec,
      isActive: true,
    }))
  );

  logger.info(`Meeting providers seeded (${results.length} rows).`);
  return results;
}
