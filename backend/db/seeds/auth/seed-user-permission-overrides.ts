import { findAdminUser, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { AppPermission, OverrideState } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionManagementService } from "@/backend/services/auth/permission-management.service";
import type { UserSelectType } from "@/backend/types";

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding user permission overrides...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableAuditLogs || !usersList?.length) {
    return [];
  }

  const parentUser = usersList.find(u => u.email === "parent@siraj.local");
  const adminUser = findAdminUser(usersList);
  if (!parentUser || !adminUser) return [];

  const inserted = await PermissionManagementService.ensureUserPermissionOverride({
    userId: parentUser.id,
    permissionKey: AppPermission.SUPPORT_SUBMIT_COMPLAINT,
    state: OverrideState.GRANTED,
    assignedByUserId: adminUser.id,
  });

  if (!inserted) {
    logger.warn("SUPPORT_SUBMIT_COMPLAINT permission not found; skipping permission overrides.");
    return [];
  }

  logger.info("User permission overrides seeded.");
  return [inserted];
}
