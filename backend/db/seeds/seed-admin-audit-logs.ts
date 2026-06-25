import { count } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { adminAuditLogs } from "@/backend/db/schema/audit";
import logger from "@/backend/lib/logger";
import type { UserEntity } from "@/backend/types";
import { ADMIN_AUDIT_ACTIONS, buildAdminAuditDescription, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(usersList: UserEntity[], config?: SeedConfig) {
  logger.info("Seeding admin audit logs...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableAuditLogs || !usersList?.length) {
    return [];
  }

  const targetCount = seedConfig.profile === "standard" ? 20 : 3;
  const [countRow] = await db.select({ value: count() }).from(adminAuditLogs);
  if (Number(countRow?.value ?? 0) >= targetCount) {
    logger.info("Admin audit logs already seeded; skipping.");
    return db.select().from(adminAuditLogs).limit(targetCount);
  }

  const adminUser = usersList.find(u => u.email === "admin@siraj.local");
  const targetUser = usersList.find(u => u.email === "teacher@siraj.local");
  if (!adminUser) return [];

  const results = [];

  for (let i = 0; i < targetCount; i++) {
    const [inserted] = await db
      .insert(adminAuditLogs)
      .values({
        actorUserId: adminUser.id,
        targetUserId: targetUser?.id ?? null,
        action: ADMIN_AUDIT_ACTIONS[i % ADMIN_AUDIT_ACTIONS.length],
        description: buildAdminAuditDescription(seedConfig, i),
        previousState: { role: "teacher_default" },
        newState: { role: "teacher_default" },
        createdAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Admin audit logs seeded (${results.length} rows).`);
  return results;
}
