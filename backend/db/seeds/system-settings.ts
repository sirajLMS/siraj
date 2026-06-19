import * as fs from "node:fs/promises";
import * as path from "node:path";
import { db } from "@/backend/db/drizzleDb";
import { systemSettings } from "@/backend/db/schema";
import logger from "@/backend/lib/logger";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";

const createSetting = (
  key: string,
  value: string,
  description: string,
  category: "security" | "system" | "scheduling",
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
  createSetting("default_timezone", "UTC", "Default fallback timezone for the system", "scheduling", "string"),
  createSetting(
    "session_absent_waiting_minutes",
    "30",
    "Minutes to wait before student can be marked absent",
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
] as const;

export async function seedOrGet() {
  logger.info("Initializing storage directories...");
  try {
    const fileSeeder = await createFileSeedingService();
    await fileSeeder.ensureDirectory("public", true);
    await fileSeeder.ensureDirectory("public/docs", true);
    logger.info("Storage directories initialized successfully.");
  } catch (error) {
    logger.error("Failed to initialize storage directories:", error);
  }

  // Seed the teacher handbook using SystemSettingsService
  logger.info("Seeding teacher handbook...");
  const handbookFileName = "teacher-handbook.pdf";
  const handbookPath = path.join(__dirname, "assets", "teacher_handbook", handbookFileName);
  try {
    const fileBuffer = await fs.readFile(handbookPath);
    await SystemSettingsService.uploadHandbook(null, handbookFileName, fileBuffer);
    logger.info("Teacher handbook seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed teacher handbook:", error);
  }

  logger.info("Seeding system settings...");
  const now = new Date();
  const results = [];

  for (const setting of SYSTEM_SETTINGS_DATA) {
    const [inserted] = await db
      .insert(systemSettings)
      .values({
        ...setting,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: setting.value,
          updatedAt: now,
        },
      })
      .returning();

    results.push(inserted);
  }

  logger.info("System settings seeded.");
  return results;
}
