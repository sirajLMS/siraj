import logger from "@/backend/lib/logger";
import type { PermissionGroupEntity, SystemSettingSelectType, TimezoneEntity, UserEntity } from "@/backend/types";
import { seedOrGet as seedOrGetPermissions } from "./seed-permissions";
import { seedOrGet as seedOrGetUsers } from "./seed-users";
import { seedOrGet as seedOrGetSystemSettings } from "./system-settings";
import { seedOrGet as seedOrGetTimezones } from "./timezones";

export type SeedContext = {
  systemSettings?: SystemSettingSelectType[];
  timezones?: TimezoneEntity[];
  permissionGroups?: PermissionGroupEntity[];
  users?: UserEntity[];
};

export async function runAllSeeds(context: SeedContext = {}): Promise<SeedContext> {
  logger.log("Starting master seed process...");

  if (!context.systemSettings) {
    logger.log("Seeding system settings...");
    context.systemSettings = await seedOrGetSystemSettings();
  }

  if (!context.timezones) {
    logger.log("Seeding common timezones...");
    context.timezones = await seedOrGetTimezones();
  }

  if (!context.permissionGroups) {
    logger.log("Seeding permissions catalog and system permission groups...");
    context.permissionGroups = await seedOrGetPermissions();
  }

  if (!context.users) {
    logger.log("Seeding system users...");
    context.users = await seedOrGetUsers(context.permissionGroups);
  }

  logger.log("Master seed process completed.");
  return context;
}
