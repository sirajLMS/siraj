import logger from "@/backend/lib/logger";
import { seedPermissions } from "../seeds/seed-permissions";
import { seedSystemSettings } from "../seeds/system-settings";
import { seedTimezones } from "../seeds/timezones";

async function runSeed(): Promise<void> {
  logger.log("Seeding system settings...");
  await seedSystemSettings();
  logger.log("Seeding common timezones...");
  await seedTimezones();
  logger.log("Seeding permissions catalog and system permission groups...");
  await seedPermissions();
  logger.log("Database seed completed successfully.");
}

runSeed().catch((err: unknown) => {
  logger.error("Database seed failed:", err);
  process.exit(1);
});
