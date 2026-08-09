import { loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { MeetingConfigService } from "@/backend/services/meeting/meeting-config.service";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";
import type { TeacherSelectType } from "@/backend/types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import { getServerTranslations } from "@/shared/locale";

export async function seedOrGet(teachersList: TeacherSelectType[], config?: SeedConfig) {
  logger.info("Seeding user meeting configs...");
  const seedConfig = config ?? loadSeedConfig();

  if (!teachersList?.length) {
    return [];
  }

  const providers = await MeetingProviderCatalogService.listAllProviders();
  const zoom = providers.find((provider: MeetingProviderSelectType) => provider.slug === "zoom");
  const googleMeet = providers.find((provider: MeetingProviderSelectType) => provider.slug === "google_meet");

  if (!zoom || !googleMeet) {
    throw new Error("Missing meeting providers required for user meeting config seeds.");
  }

  const targets = seedConfig.profile === "standard" ? teachersList.slice(0, 2) : teachersList.slice(0, 1);
  const inputs = targets.map((teacher, index) => ({
    userId: teacher.userId,
    providerId: index === 0 ? zoom.id : googleMeet.id,
    label: index === 0 ? "Primary Zoom Room" : "Google Meet Backup",
    isDefault: index === 0,
    details: {
      meetingUrl: index === 0 ? "https://zoom.us/j/seed-teacher-room" : "https://meet.google.com/seed-teacher-room",
    },
    password: index === 0 ? "seed-zoom-pass" : null,
  }));

  const tErrors = getServerTranslations("en").errorsTranslations;
  const results = await MeetingConfigService.upsertManyUserMeetingConfigs(inputs, tErrors);
  logger.info(`User meeting configs seeded (${results.length} rows).`);
  return results;
}
