import * as fs from "node:fs/promises";
import { resolveAssetPath } from "@/backend/db/seeds/lib/file-seed-helper";
import { orchestrateSeedMany } from "@/backend/db/seeds/lib/orchestrate-seed-many";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { ENV_CONFIG_KEYS } from "@/backend/lib/env-config-keys";
import { logger } from "@/backend/lib/logger";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import type { SystemSettingSelectType } from "@/backend/types";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";
import { getServerTranslations } from "@/shared/locale";

/** Matches `env-config-resolver.ts` / `environment-config.service.ts` DB key prefix. */
const ENV_SETTING_KEY_PREFIX = "env::";

const createSetting = (
  key: string,
  value: string,
  description: string,
  category: SystemSettingCategory,
  dataType: SystemSettingDataType = SystemSettingDataType.Integer
) => ({
  key,
  value,
  dataType,
  description,
  category,
});

const SYSTEM_SETTINGS_DATA = [
  createSetting(
    "auth_max_attempts",
    "5",
    "Maximum failed login attempts before lockout",
    SystemSettingCategory.Security
  ),
  createSetting("auth_lockout_minutes", "15", "Duration of account lockout in minutes", SystemSettingCategory.Security),
  createSetting(
    "password_reset_expiry_hours",
    "24",
    "Expiration time for password reset tokens in hours",
    SystemSettingCategory.Security
  ),
  createSetting(
    "cache_default_ttl_seconds",
    "3600",
    "Default TTL for cache entries in seconds",
    SystemSettingCategory.System
  ),
  createSetting(
    "session_activation_window_before_minutes",
    "5",
    "Minutes before scheduled start time that a session can be activated",
    SystemSettingCategory.Scheduling
  ),
  createSetting(
    "default_timezone",
    IanaTimezone.UTC,
    "Default fallback timezone for the system",
    SystemSettingCategory.Scheduling,
    SystemSettingDataType.String
  ),
  createSetting(
    "session_absent_waiting_minutes",
    "30",
    "Minutes to wait before student can be marked absent",
    SystemSettingCategory.Scheduling
  ),
  createSetting(
    "session_missed_grace_minutes",
    "15",
    "Minutes after scheduled end time before an unactivated class is auto-marked as missed",
    SystemSettingCategory.Scheduling
  ),
  createSetting(
    "session_leave_reschedule_offset_days",
    "7",
    "Days offset to reschedule when leave is processed",
    SystemSettingCategory.Scheduling
  ),
  createSetting(
    "teacher_max_leaves",
    "2",
    "Maximum number of leave requests a teacher can make per calendar month",
    SystemSettingCategory.Scheduling
  ),
  createSetting(
    "student_max_leaves",
    "2",
    "Maximum number of leave requests a student can make per calendar month",
    SystemSettingCategory.Scheduling
  ),
  createSetting(
    "complaint_max_file_size_mb",
    "25",
    "Maximum file size for complaint attachments in MB",
    SystemSettingCategory.Communication
  ),
  createSetting(
    "complaint_max_files_per_complaint",
    "5",
    "Maximum number of files per complaint",
    SystemSettingCategory.Communication
  ),
  createSetting(
    "sms_rate_limit_per_hour",
    "3",
    "Maximum SMS messages per parent per hour",
    SystemSettingCategory.Communication
  ),
  createSetting(
    "maintenance_mode",
    "false",
    "Maintenance mode flag",
    SystemSettingCategory.System,
    SystemSettingDataType.Boolean
  ),
  createSetting(
    "feature_flags",
    `{"new_dashboard":false}`,
    "Feature flags JSON",
    SystemSettingCategory.System,
    SystemSettingDataType.Json
  ),
] as const;

type EnvConfigPlaceholderSetting = SystemSettingsService.SystemSettingUpsertInput;

/**
 * Placeholder rows for Settings → Environment Config. Empty `value` is treated as
 * "no override" by the resolver (env fallback remains intact).
 */
const ENV_CONFIG_PLACEHOLDER_SETTINGS: EnvConfigPlaceholderSetting[] = ENV_CONFIG_KEYS.filter(
  descriptor => !descriptor.excludeFromDb
).map(descriptor => ({
  key: `${ENV_SETTING_KEY_PREFIX}${descriptor.key}`,
  value: "",
  dataType: SystemSettingDataType.String,
  description: descriptor.description.en,
  category: SystemSettingCategory.System,
}));

async function findSettingsByKeys(keys: string[]): Promise<Map<string, SystemSettingSelectType>> {
  const entries = await Promise.all(
    keys.map(async key => {
      const row = await SystemSettingsService.getSettingByKey(key);
      return row ? ([key, row] as const) : null;
    })
  );
  return new Map(entries.filter((entry): entry is [string, SystemSettingSelectType] => entry !== null));
}

const SEED_STORAGE_DIRECTORIES = [
  "public",
  "public/docs",
  "public/avatars",
  "public/avatars/students",
  "public/avatars/teachers",
  "public/avatars/parents",
  "public/invoices",
  "public/complaints",
  "public/resources",
] as const;

export async function seedOrGet() {
  const tErrors = getServerTranslations("ar").errorsTranslations;
  logger.info("Initializing storage directories...");
  try {
    const fileSeeder = await createFileSeedingService();
    await Promise.all(SEED_STORAGE_DIRECTORIES.map(dir => fileSeeder.ensureDirectory(dir, true)));
    logger.info("Storage directories initialized successfully.");
  } catch (error) {
    logger.error("Failed to initialize storage directories:", error);
    throw error;
  }

  logger.info("Seeding teacher handbook...");
  const handbookFileName = "teacher-handbook.pdf";
  const handbookPath = resolveAssetPath(`teacher_handbook/${handbookFileName}`);
  try {
    const fileBuffer = await fs.readFile(handbookPath);
    await SystemSettingsService.uploadHandbook(null, handbookFileName, fileBuffer, tErrors);
    logger.info("Teacher handbook seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed teacher handbook:", error);
  }

  logger.info("Seeding parent handbook...");
  const parentHandbookFileName = "parent-handbook.pdf";
  const parentHandbookPath = resolveAssetPath("documents/sample-resource.pdf");
  try {
    const parentFileBuffer = await fs.readFile(parentHandbookPath);
    await SystemSettingsService.uploadParentHandbook(null, parentHandbookFileName, parentFileBuffer, tErrors);
    logger.info("Parent handbook seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed parent handbook:", error);
  }

  logger.info("Seeding system settings...");
  const results = await SystemSettingsService.upsertManySettings([...SYSTEM_SETTINGS_DATA]);
  logger.info("System settings seeded.");

  logger.info(
    `Seeding env config placeholder settings (${ENV_CONFIG_PLACEHOLDER_SETTINGS.length} keys, ${ENV_CONFIG_KEYS.length - ENV_CONFIG_PLACEHOLDER_SETTINGS.length} excluded)...`
  );
  await orchestrateSeedMany({
    specs: ENV_CONFIG_PLACEHOLDER_SETTINGS,
    toKey: spec => spec.key,
    findExisting: findSettingsByKeys,
    createMany: toCreate => SystemSettingsService.upsertManySettings(toCreate),
    refetchOnRace: findSettingsByKeys,
  });
  logger.info("Env config placeholder settings seeded.");

  return results;
}
