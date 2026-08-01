import { QuotaKind } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { QuotaService } from "@/backend/services/billing/quota.service";

export async function seedOrGet() {
  logger.info("Seeding sample billing quotas...");

  const now = new Date().toISOString();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Use the atomic seedOrGetQuota bootstrap method — check-then-create runs
    // inside a single db.transaction to eliminate the race condition where
    // two concurrent seed processes could both see zero rows and both insert.
    const rows = await QuotaService.seedOrGetQuota({
      studentId: "00000000-0000-0000-0000-000000000001",
      kind: QuotaKind.PACKAGE,
      name: "Demo Package Quota",
      totalClasses: 10,
      validFrom: now,
      validUntil: nextMonth,
      priority: 10,
    });

    if (rows.length > 0) {
      logger.info(`Billing quotas present (${rows.length} rows).`);
    } else {
      logger.info("No billing quotas seeded (demo student UUID may not exist).");
    }
    return rows;
  } catch (err) {
    logger.warn("Could not seed demo quota (student UUID may not exist):", { err });
    return [];
  }
}
