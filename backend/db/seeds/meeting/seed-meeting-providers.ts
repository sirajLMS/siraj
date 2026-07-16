import { seedCatalogLogoUrls } from "@/backend/db/seeds/lib/logo-seed-helper";
import {
  MEETING_PROVIDER_CATALOG_SEEDS,
  type MeetingProviderCatalogSeed,
} from "@/backend/db/seeds/lib/meeting-provider-factory";
import logger from "@/backend/lib/logger";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";
import { getServerTranslations } from "@/shared/locale";

export async function seedOrGet() {
  logger.info("Seeding meeting providers...");

  const slugs = MEETING_PROVIDER_CATALOG_SEEDS.map((spec: MeetingProviderCatalogSeed) => spec.slug);
  const logoUrls = await seedCatalogLogoUrls("meeting", slugs);

  const tErrors = getServerTranslations("en").errorsTranslations;
  const results = await MeetingProviderCatalogService.upsertManyProviders(
    MEETING_PROVIDER_CATALOG_SEEDS.map((spec: MeetingProviderCatalogSeed) => ({
      ...spec,
      logoUrl: logoUrls.get(spec.slug) ?? null,
      isActive: true,
    })),
    tErrors
  );

  logger.info(`Meeting providers seeded (${results.length} rows).`);
  return results;
}
