import { loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { MeetingConfigService } from "@/backend/services/meeting/meeting-config.service";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";
import type { ClassInstanceEntity } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export async function seedOrGet(classInstancesList: ClassInstanceEntity[], config?: SeedConfig) {
  logger.info("Seeding class meeting configs...");
  const seedConfig = config ?? loadSeedConfig();

  if (!classInstancesList?.length) {
    return [];
  }

  const providers = await MeetingProviderCatalogService.listAllProviders();
  const zoom = providers.find(provider => provider.slug === "zoom");
  if (!zoom) {
    throw new Error("Missing Zoom provider required for class meeting config seeds.");
  }

  const targets = seedConfig.profile === "standard" ? classInstancesList.slice(0, 2) : classInstancesList.slice(0, 1);
  const inputs = targets.map((instance, index) => ({
    classInstanceId: instance.id,
    recurringScheduleId: null,
    providerId: zoom.id,
    label: index === 0 ? "Class Zoom Override" : "Secondary Class Zoom",
    isDefault: index === 0,
    details: {
      meetingUrl: `https://zoom.us/j/seed-class-${instance.id.slice(0, 8)}`,
    },
    encryptedSecret: null,
  }));

  const tErrors = await getServerTranslations("en", "errors");
  const results = await MeetingConfigService.upsertManyClassMeetingConfigs(inputs, tErrors);
  logger.info(`Class meeting configs seeded (${results.length} rows).`);
  return results;
}
