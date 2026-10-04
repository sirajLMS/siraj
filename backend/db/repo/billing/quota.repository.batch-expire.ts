import { and, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";

import { withForUpdate } from "@/backend/db";
import {
  buildRedeemBatchLedgerRows,
  deriveExpireIdempotencyKey,
  deriveIdempotencyKey,
  fetchRedemptionGuardRow,
  findUnredeemedInstanceIds,
  MAX_EXPIRING_QUOTAS_PER_RUN,
  markInstancesQuotaDeducted,
} from "@/backend/db/repo/billing/quota.repository.helpers";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { quotas } from "@/backend/db/schema";
import { QuotaLedgerReason, QuotaStatus } from "@/backend/enum";
import { QuotaLedgerError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import type { DBTransaction, QuotaSelectType } from "@/backend/types";

type ExpireLedgerRow = {
  quotaId: string;
  studentId: string;
  recurringScheduleId?: string | null;
  classInstanceId?: string | null;
  delta: number;
  reason: QuotaLedgerReason;
  reasonNote?: string | null;
  actorUserId?: string | null;
  idempotencyKey: string;
};

export const redeemForInstanceBatchImpl = async (
  tx: DBTransaction,
  input: {
    quotaId: string;
    studentId: string;
    recurringScheduleId?: string | null;
    instanceIds: string[];
    actorUserId?: string | null;
  }
): Promise<{ redeemedCount: number; quota: QuotaSelectType | null }> => {
  if (input.instanceIds.length === 0) {
    return { redeemedCount: 0, quota: null };
  }

  const now = new Date();

  // Determine which instances are not yet redeemed by checking existing ledger entries
  // with the same per-instance idempotency keys (RB2-5 dedup).
  const newInstanceIds = await findUnredeemedInstanceIds(tx, input.instanceIds, input.quotaId);

  if (newInstanceIds.length === 0) {
    // All instances were already redeemed; no deduction needed
    const [existingQuota] = await tx
      .select()
      .from(quotas)
      .where(and(eq(quotas.id, input.quotaId), eq(quotas.studentId, input.studentId)))
      .limit(1);
    return { redeemedCount: 0, quota: existingQuota ?? null };
  }

  const newCount = newInstanceIds.length;

  // Guard: ensure quota is active and has enough remaining for the not-yet-redeemed instances.
  const guardRow = await fetchRedemptionGuardRow(tx, input.quotaId, input.studentId, newCount);
  if (!guardRow) {
    return { redeemedCount: 0, quota: null };
  }

  // AUDIT: ledger entries required for REDEEM batch tracking and balance reconstruction
  const ledgerRows = buildRedeemBatchLedgerRows(input, newInstanceIds);
  const inserted = await QuotaLedgerRepository.insertBatch(tx, ledgerRows);
  const redeemedCount = inserted.length;

  // Deduct ONLY by the actual number of newly inserted ledger rows, not the full count.
  // This prevents quota loss when some instances were already redeemed (idempotency dedup).
  if (redeemedCount === 0) {
    // Nothing newly inserted — all instances were already redeemed; no deduction needed
    return { redeemedCount: 0, quota: guardRow };
  }

  const [updated] = await tx
    .update(quotas)
    .set({
      remaining: sql<number>`${quotas.remaining} - ${redeemedCount}`,
      usedThisPeriod: sql<number>`${quotas.usedThisPeriod} + ${redeemedCount}`,
      version: sql<number>`${quotas.version} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(quotas.id, input.quotaId),
        eq(quotas.studentId, input.studentId),
        eq(quotas.status, QuotaStatus.ACTIVE),
        gte(quotas.remaining, redeemedCount),
        isNull(quotas.deletedAt)
      )
    )
    .returning();

  if (!updated) {
    // Concurrent transaction depleted remaining between guard SELECT and this UPDATE.
    // Throwing forces tx rollback, discarding the already-inserted ledger rows and
    // preventing ledger/aggregate drift.
    throw new QuotaLedgerError("Quota redemption failed: insufficient remaining after concurrent deduction");
  }

  // Mark the redeemed instances as quota-deducted (CR-2/CR-4 root-cause fix):
  // without it, clearWeeklySchedule (recurring.ts) skips pool-mode instances when
  // refunding, leaking quota; and refreshPeriodic resets reservedClasses from these
  // flags, so missing flags cause a CHECK-constraint violation
  // (reservedClasses + remaining > totalClasses).
  const insertedInstanceIds = inserted.map(row => row.classInstanceId).filter((id): id is string => id !== null);
  if (insertedInstanceIds.length > 0) {
    await markInstancesQuotaDeducted(tx, insertedInstanceIds, now);
  }

  return { redeemedCount, quota: updated };
};

export const expireOverdueImpl = async (tx: DBTransaction, asOfDate?: Date): Promise<QuotaSelectType[]> => {
  const checkDateStr = (asOfDate ?? new Date()).toISOString().slice(0, 10);
  const now = new Date();

  // Note: First cron run mass-expires all back-dated quotas — ensure scheduled after initial migration deployment
  // SELECT ... FOR UPDATE to lock rows and capture pre-expiry remaining/reserved.
  // We cannot use UPDATE ... RETURNING because the SET clause zeros remaining,
  // so RETURNING would yield post-update (zeroed) values, not the true balances
  // needed for accurate EXPIRE ledger entries.
  // Defensive LIMIT: caps the number of rows locked per cron tick to avoid
  // unbounded row locking. Remaining overdue quotas are picked up on the next
  // tick (sweeper runs on a recurring schedule).
  const expiredQuotas = await withForUpdate(
    tx
      .select()
      .from(quotas)
      .where(and(eq(quotas.status, QuotaStatus.ACTIVE), lt(quotas.validUntil, checkDateStr), isNull(quotas.deletedAt)))
      .limit(MAX_EXPIRING_QUOTAS_PER_RUN)
  );

  if (expiredQuotas.length === 0) return [];

  const expiredIds = expiredQuotas.map(q => q.id);

  // Zero out remaining + reserved, set status EXPIRED.
  await tx
    .update(quotas)
    .set({
      status: QuotaStatus.EXPIRED,
      remaining: 0,
      reservedClasses: 0,
      version: sql<number>`${quotas.version} + 1`,
      updatedAt: now,
    })
    .where(and(inArray(quotas.id, expiredIds), eq(quotas.status, QuotaStatus.ACTIVE)));

  // Collect all ledger entries (EXPIRE + RELEASE-ORPHAN) and insert in a single batch (PERF-4).
  const ledgerRows: ExpireLedgerRow[] = [];

  for (const qRow of expiredQuotas) {
    // BL-5: Before zeroing reservedClasses, release earmarked reservations so the
    // ledger reflects the orphaned reserved classes being returned.
    if (qRow.reservedClasses > 0) {
      logger.info(
        `expireOverdue: quota ${qRow.id} has ${qRow.reservedClasses} reserved classes being released as EXPIRE_ORPHAN`
      );
      ledgerRows.push({
        quotaId: qRow.id,
        studentId: qRow.studentId,
        delta: qRow.reservedClasses,
        reason: QuotaLedgerReason.RELEASE,
        reasonNote: `Expired ${qRow.reservedClasses} orphaned reserved classes`,
        idempotencyKey: deriveIdempotencyKey("expire-orphan", qRow.id, checkDateStr),
      });
    }

    if (qRow.remaining > 0) {
      ledgerRows.push({
        quotaId: qRow.id,
        studentId: qRow.studentId,
        delta: -qRow.remaining,
        reason: QuotaLedgerReason.EXPIRE,
        reasonNote: `Expired ${qRow.remaining} unredeemed classes`,
        idempotencyKey: deriveExpireIdempotencyKey(qRow.id, checkDateStr),
      });
    }
  }

  if (ledgerRows.length > 0) {
    await QuotaLedgerRepository.insertBatch(tx, ledgerRows);
  }

  // Re-select to return the updated rows.
  return tx
    .select()
    .from(quotas)
    .where(and(inArray(quotas.id, expiredIds), eq(quotas.status, QuotaStatus.EXPIRED)));
};
