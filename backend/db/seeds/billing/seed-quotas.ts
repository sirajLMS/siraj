import { QuotaKind } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { QuotaService } from "@/backend/services/billing/quota.service";

export async function seedOrGet() {
  logger.info("Seeding sample billing quotas...");

  const existing = await QuotaService.listQuotas({}, { perPage: 1000, currentPage: 1, offset: 0 });

  if (existing.rows.length > 0) {
    logger.info(`Billing quotas already present (${existing.rows.length} rows).`);
    return existing.rows;
  }

  const now = new Date().toISOString();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Create a sample package quota for demo
  try {
    const q1 = await QuotaService.createQuota({
      studentId: "00000000-0000-0000-0000-000000000001",
      kind: QuotaKind.PACKAGE,
      name: "Demo Package Quota",
      totalClasses: 10,
      validFrom: now,
      validUntil: nextMonth,
      priority: 10,
    });
    logger.info(`Sample billing quota seeded (${q1.id}).`);
    return [q1];
  } catch (err) {
    logger.warn("Could not seed demo quota (student UUID may not exist):", { err });
    return [];
  }
}
