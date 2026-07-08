import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { permissions, userPermissionOverrides } from "@/backend/db/schema/permissions";
import { AppPermission } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import type { UserSelectType } from "@/backend/types";
import { findAdminUser, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding user permission overrides...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableAuditLogs || !usersList?.length) {
    return [];
  }

  const parentUser = usersList.find(u => u.email === "parent@siraj.local");
  const adminUser = findAdminUser(usersList);
  if (!parentUser || !adminUser) return [];

  const [permission] = await db
    .select()
    .from(permissions)
    .where(eq(permissions.key, AppPermission.SUPPORT_SUBMIT_COMPLAINT))
    .limit(1);

  if (!permission) {
    logger.warn("SUPPORT_SUBMIT_COMPLAINT permission not found; skipping permission overrides.");
    return [];
  }

  const [inserted] = await db
    .insert(userPermissionOverrides)
    .values({
      userId: parentUser.id,
      permissionId: permission.id,
      state: "GRANTED",
      assignedByUserId: adminUser.id,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: [userPermissionOverrides.userId, userPermissionOverrides.permissionId],
      set: { state: "GRANTED" },
    })
    .returning();

  logger.info("User permission overrides seeded.");
  return [inserted];
}
