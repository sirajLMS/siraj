import { db } from "@/backend/db/drizzleDb";
import { systemSettings } from "@/backend/db/schema";
import logger from "@/backend/lib/logger";

export async function seedSystemSettings() {
  logger.info("Seeding system settings...");

  const settings = [
    {
      key: "auth_max_attempts",
      value: "5",
      dataType: "integer",
      description: "Maximum failed login attempts before lockout",
      category: "security",
      updatedAt: new Date(),
    },
    {
      key: "auth_lockout_minutes",
      value: "15",
      dataType: "integer",
      description: "Duration of account lockout in minutes",
      category: "security",
      updatedAt: new Date(),
    },
    {
      key: "password_reset_expiry_hours",
      value: "24",
      dataType: "integer",
      description: "Expiration time for password reset tokens in hours",
      category: "security",
      updatedAt: new Date(),
    },
    {
      key: "cache_default_ttl_seconds",
      value: "3600",
      dataType: "integer",
      description: "Default TTL for cache entries in seconds",
      category: "system",
      updatedAt: new Date(),
    },
  ];

  for (const setting of settings) {
    await db
      .insert(systemSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: setting.value,
          updatedAt: setting.updatedAt,
        },
      });
  }

  logger.info("System settings seeded.");
}
