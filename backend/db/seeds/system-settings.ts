import { db } from "@/backend/db/drizzleDb";
import { systemSettings } from "@/backend/db/schema";
import logger from "@/backend/lib/logger";

const SYSTEM_SETTINGS_DATA = [
  {
    key: "auth_max_attempts",
    value: "5",
    dataType: "integer",
    description: "Maximum failed login attempts before lockout",
    category: "security",
  },
  {
    key: "auth_lockout_minutes",
    value: "15",
    dataType: "integer",
    description: "Duration of account lockout in minutes",
    category: "security",
  },
  {
    key: "password_reset_expiry_hours",
    value: "24",
    dataType: "integer",
    description: "Expiration time for password reset tokens in hours",
    category: "security",
  },
  {
    key: "cache_default_ttl_seconds",
    value: "3600",
    dataType: "integer",
    description: "Default TTL for cache entries in seconds",
    category: "system",
  },
  {
    key: "session_activation_window_before_minutes",
    value: "5",
    dataType: "integer",
    description: "Minutes before scheduled start time that a session can be activated",
    category: "scheduling",
  },
  {
    key: "default_timezone",
    value: "UTC",
    dataType: "string",
    description: "Default fallback timezone for the system",
    category: "scheduling",
  },
] as const;

export async function seedOrGet() {
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
