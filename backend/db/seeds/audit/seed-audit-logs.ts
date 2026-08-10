import {
  AUDIT_ENTITY_TYPES,
  buildAdminAuditDescription,
  findAdminUser,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { AuditService } from "@/backend/services/system/audit.service";
import type { CreateAuditLogInput, InvoiceSelectType, UserSelectType } from "@/backend/types";

export async function seedOrGet(usersList: UserSelectType[], invoicesList: InvoiceSelectType[], config?: SeedConfig) {
  logger.info("Seeding audit logs...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableAuditLogs || !usersList?.length) {
    return [];
  }

  const targetCount = seedConfig.profile === "standard" ? 20 : 3;
  const existingCount = await AuditService.countAuditLogs();
  if (existingCount >= targetCount) {
    logger.info("Audit logs already seeded; skipping.");
    return AuditService.listAuditLogs(targetCount);
  }

  const adminUser = findAdminUser(usersList);
  const inputs: CreateAuditLogInput[] = [];

  for (let i = 0; i < targetCount; i++) {
    const entityType = AUDIT_ENTITY_TYPES[i % AUDIT_ENTITY_TYPES.length];
    const invoice = invoicesList[i % Math.max(invoicesList.length, 1)];
    let entityId: string;
    if ((entityType === "INVOICE" || entityType === "PAYMENT") && invoice) {
      entityId = invoice.id;
    } else {
      entityId = `seed-${i}`;
    }

    inputs.push({
      actorUserId: adminUser?.id ?? null,
      actorType: "USER",
      entityType,
      entityId,
      action: i % 2 === 0 ? "CREATE" : "UPDATE",
      description: buildAdminAuditDescription(seedConfig, i + 100),
      newState: { seeded: true, index: i },
      createdAt: now,
    });
  }

  const results = await AuditService.createManyAuditLogs(inputs);
  logger.info(`Audit logs seeded (${results.length} rows).`);
  return results.length > 0 ? results : AuditService.listAuditLogs(targetCount);
}
