import { count } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs } from "@/backend/db/schema/audit";
import {
  AUDIT_ENTITY_TYPES,
  buildAdminAuditDescription,
  findAdminUser,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import type { InvoiceSelectType, UserSelectType } from "@/backend/types";

export async function seedOrGet(usersList: UserSelectType[], invoicesList: InvoiceSelectType[], config?: SeedConfig) {
  logger.info("Seeding audit logs...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableAuditLogs || !usersList?.length) {
    return [];
  }

  const targetCount = seedConfig.profile === "standard" ? 20 : 3;
  const [countRow] = await db.select({ value: count() }).from(auditLogs);
  if (Number(countRow?.value ?? 0) >= targetCount) {
    logger.info("Audit logs already seeded; skipping.");
    return db.select().from(auditLogs).limit(targetCount);
  }

  const adminUser = findAdminUser(usersList);
  const results = [];

  for (let i = 0; i < targetCount; i++) {
    const entityType = AUDIT_ENTITY_TYPES[i % AUDIT_ENTITY_TYPES.length];
    const invoice = invoicesList[i % Math.max(invoicesList.length, 1)];
    let entityId: string;
    if ((entityType === "INVOICE" || entityType === "PAYMENT") && invoice) {
      entityId = invoice.id;
    } else {
      entityId = `seed-${i}`;
    }

    const [inserted] = await db
      .insert(auditLogs)
      .values({
        actorUserId: adminUser?.id ?? null,
        actorType: "USER",
        entityType,
        entityId,
        action: i % 2 === 0 ? "CREATE" : "UPDATE",
        description: buildAdminAuditDescription(seedConfig, i + 100),
        newState: { seeded: true, index: i },
        createdAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Audit logs seeded (${results.length} rows).`);
  return results;
}
