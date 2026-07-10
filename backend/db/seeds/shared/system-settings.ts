import * as fs from "node:fs/promises";
import { resolveAssetPath } from "@/backend/db/seeds/lib/file-seed-helper";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import logger from "@/backend/lib/logger";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";

const createSetting = (
  key: string,
  value: string,
  description: string,
  category: "security" | "system" | "scheduling" | "communication",
  dataType: "integer" | "string" = "integer"
) => ({
  key,
  value,
  dataType,
  description,
  category,
});

const SYSTEM_SETTINGS_DATA = [
  createSetting("auth_max_attempts", "5", "Maximum failed login attempts before lockout", "security"),
  createSetting("auth_lockout_minutes", "15", "Duration of account lockout in minutes", "security"),
  createSetting("password_reset_expiry_hours", "24", "Expiration time for password reset tokens in hours", "security"),
  createSetting("cache_default_ttl_seconds", "3600", "Default TTL for cache entries in seconds", "system"),
  createSetting(
    "session_activation_window_before_minutes",
    "5",
    "Minutes before scheduled start time that a session can be activated",
    "scheduling"
  ),
  createSetting(
    "default_timezone",
    IanaTimezone.UTC,
    "Default fallback timezone for the system",
    "scheduling",
    "string"
  ),
  createSetting(
    "session_absent_waiting_minutes",
    "30",
    "Minutes to wait before student can be marked absent",
    "scheduling"
  ),
  createSetting(
    "session_missed_grace_minutes",
    "15",
    "Minutes after scheduled end time before an unactivated class is auto-marked as missed",
    "scheduling"
  ),
  createSetting(
    "session_leave_reschedule_offset_days",
    "7",
    "Days offset to reschedule when leave is processed",
    "scheduling"
  ),
  createSetting(
    "teacher_max_leaves",
    "2",
    "Maximum number of leave requests a teacher can make per calendar month",
    "scheduling"
  ),
  createSetting(
    "student_max_leaves",
    "2",
    "Maximum number of leave requests a student can make per calendar month",
    "scheduling"
  ),
  createSetting(
    "complaint_max_file_size_mb",
    "25",
    "Maximum file size for complaint attachments in MB",
    "communication"
  ),
  createSetting("complaint_max_files_per_complaint", "5", "Maximum number of files per complaint", "communication"),
  createSetting("sms_rate_limit_per_hour", "3", "Maximum SMS messages per parent per hour", "communication"),
] as const;

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
  logger.info("Initializing storage directories...");
  try {
    const fileSeeder = await createFileSeedingService();
    for (const dir of SEED_STORAGE_DIRECTORIES) {
      await fileSeeder.ensureDirectory(dir, true);
    }
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
    await SystemSettingsService.uploadHandbook(null, handbookFileName, fileBuffer);
    logger.info("Teacher handbook seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed teacher handbook:", error);
  }

  logger.info("Seeding parent handbook...");
  const parentHandbookFileName = "parent-handbook.pdf";
  const parentHandbookPath = resolveAssetPath("documents/sample-resource.pdf");
  try {
    const parentFileBuffer = await fs.readFile(parentHandbookPath);
    await SystemSettingsService.uploadParentHandbook(null, parentHandbookFileName, parentFileBuffer);
    logger.info("Parent handbook seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed parent handbook:", error);
  }

  logger.info("Seeding system settings...");
  const results = await SystemSettingsService.upsertManySettings([...SYSTEM_SETTINGS_DATA]);
  logger.info("System settings seeded.");
  return results;
}
