import {
  ADMIN_AUDIT_ACTIONS,
  buildAdminAuditDescription,
  findAdminUser,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { AuditService } from "@/backend/services";
import type { CreateAdminAuditLogInput, UserSelectType } from "@/backend/types";

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding admin audit logs...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableAuditLogs || !usersList?.length) {
    return [];
  }

  const targetCount = seedConfig.profile === "standard" ? 20 : 3;
  const existingCount = await AuditService.countAdminAuditLogs();
  if (existingCount >= targetCount) {
    logger.info("Admin audit logs already seeded; skipping.");
    return AuditService.listAdminAuditLogs(targetCount);
  }

  const adminUser = findAdminUser(usersList);
  const targetUser = usersList.find(u => u.email === "teacher@siraj.local");
  if (!adminUser) return [];

  const inputs: CreateAdminAuditLogInput[] = [];
  for (let i = 0; i < targetCount; i++) {
    inputs.push({
      actorUserId: adminUser.id,
      targetUserId: targetUser?.id ?? null,
      action: ADMIN_AUDIT_ACTIONS[i % ADMIN_AUDIT_ACTIONS.length],
      description: buildAdminAuditDescription(seedConfig, i),
      previousState: { role: "teacher_default" },
      newState: { role: "teacher_default" },
      createdAt: now,
    });
  }

  const results = await AuditService.createManyAdminAuditLogs(inputs);
  logger.info(`Admin audit logs seeded (${results.length} rows).`);
  return results.length > 0 ? results : AuditService.listAdminAuditLogs(targetCount);
}
