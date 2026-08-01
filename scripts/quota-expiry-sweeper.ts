import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { parents, quotas, students } from "@/backend/db/schema";
import { QuotaStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { QuotaNotificationService } from "@/backend/services/billing/quota-notification.service";
import type { QuotaSelectType } from "@/backend/types/billing/quota.types";

/** Quotas with validUntil within this many days are considered "expiring soon". */
const EXPIRY_NOTICE_DAYS = 7;

/** Low-balance threshold: remaining <= this fraction of totalClasses triggers a notification. */
const LOW_BALANCE_THRESHOLD_FRACTION = 0.2;

/** Low-balance absolute floor: always notify if remaining drops to/below this many classes. */
const LOW_BALANCE_ABSOLUTE_FLOOR = 3;

/** Maximum number of expiring quotas to process per sweeper run (unbounded SELECT guard — RP2-9). */
const MAX_EXPIRING_QUOTAS_PER_RUN = 500;

interface QuotaNotificationTarget {
  affectedUserIds: string[];
  quotaName: string;
  studentName: string;
}

/**
 * Resolves the parent userId(s) for each quota's studentId, plus the student's
 * display name. Returns a Map keyed by quotaId. When no parent is linked, falls
 * back to the student's own userId so the notification still reaches a user.
 */
async function resolveQuotaNotificationTargets(
  quotaRows: QuotaSelectType[]
): Promise<Map<string, QuotaNotificationTarget>> {
  if (quotaRows.length === 0) return new Map();

  const studentIds = [...new Set(quotaRows.map(q => q.studentId))];

  const studentRows = await db
    .select({
      studentId: students.id,
      studentUserId: students.userId,
      parentId: students.parentId,
      studentName: students.name,
    })
    .from(students)
    .where(inArray(students.id, studentIds));

  let parentUserMap = new Map<string, string>();
  const validParents = studentRows.filter(s => s.parentId !== null);
  if (validParents.length > 0) {
    const parentIds = [...new Set(validParents.map(s => s.parentId as string))];
    const parentRows = await db
      .select({
        parentId: parents.id,
        userId: parents.userId,
      })
      .from(parents)
      .where(inArray(parents.id, parentIds));
    parentUserMap = new Map(parentRows.map(p => [p.parentId, p.userId]));
  }

  const result = new Map<string, QuotaNotificationTarget>();
  for (const q of quotaRows) {
    const studentRow = studentRows.find(s => s.studentId === q.studentId);
    if (!studentRow) continue;

    // Prefer the parent's userId as the notification recipient.
    const parentUserId = studentRow.parentId ? (parentUserMap.get(studentRow.parentId) ?? null) : null;
    const affectedUserIds: string[] = [];
    if (parentUserId) affectedUserIds.push(parentUserId);
    else if (studentRow.studentUserId) affectedUserIds.push(studentRow.studentUserId);

    result.set(q.id, {
      affectedUserIds,
      quotaName: q.name,
      studentName: studentRow.studentName,
    });
  }

  return result;
}

export async function runQuotaExpirySweeper(): Promise<void> {
  logger.info("[QuotaExpirySweeper] Starting quota expiry & periodic refresh sweep...");
  try {
    // ── 1. Expire overdue quotas ───────────────────────────────────────────
    const expiredQuotas = await QuotaService.expireOverdueQuotas();
    logger.info(`[QuotaExpirySweeper] Expired ${expiredQuotas.length} overdue quotas.`);

    // ── 2. Query quotas approaching expiry (validUntil within N days) ──────
    const todayStr = new Date().toISOString().slice(0, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + EXPIRY_NOTICE_DAYS);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    const expiringSoonQuotas: QuotaSelectType[] = await db
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.status, QuotaStatus.ACTIVE),
          isNull(quotas.deletedAt),
          sql`${quotas.validUntil} > ${todayStr}`,
          sql`${quotas.validUntil} <= ${cutoffStr}`
        )
      )
      .limit(MAX_EXPIRING_QUOTAS_PER_RUN);

    // ── 3. Resolve notification targets (parent userIds) for both sets ─────
    // RP2-7: Parallelise the 3 independent resolveQuotaNotificationTargets calls.
    const [expiredTargets, expiringTargets] = await Promise.all([
      resolveQuotaNotificationTargets(expiredQuotas),
      resolveQuotaNotificationTargets(expiringSoonQuotas),
    ]);

    // ── 4. Periodic refresh + collect low-balance candidates ───────────────
    // Collect post-refresh quota snapshots inside the transaction; dispatch
    // notifications after commit to avoid holding the tx open during dispatch.
    const lowBalanceQuotas: QuotaSelectType[] = [];

    await db.transaction(async tx => {
      // RCOMP-1: Call QuotaService.listPeriodicForRollover (service layer) instead
      // of QuotaRepository.listPeriodicForRollover directly — the service is the
      // canonical entry point per the single-writer principle.
      const periodicQuotas = await QuotaService.listPeriodicForRollover(tx);
      for (const quota of periodicQuotas) {
        // QuotaService.refreshPeriodic atomically: reads the target, computes
        // the rollover amount from the rich JSONB policy
        // (maxRolloverPercent / accumulationCap), inserts EXPIRE + per-period GRANT
        // ledger entries with idempotency keys, advances periodAnchor past `now`,
        // and updates `remaining` / `usedThisPeriod` with an optimistic-concurrency
        // version check. It no-ops when the current period has not ended, so
        // re-running the sweeper is safe and `listPeriodicForRollover` will not
        // re-select the same quota every cron tick.
        const refreshed = await QuotaService.refreshPeriodic(tx, quota.id, null);

        const threshold = Math.max(
          Math.floor(refreshed.totalClasses * LOW_BALANCE_THRESHOLD_FRACTION),
          LOW_BALANCE_ABSOLUTE_FLOOR
        );
        if (refreshed.remaining > 0 && refreshed.remaining <= threshold) {
          lowBalanceQuotas.push(refreshed as QuotaSelectType);
        }
      }
    });

    const lowBalanceTargets = await resolveQuotaNotificationTargets(lowBalanceQuotas);

    // ── 5. Dispatch notifications (after tx commits) ──────────────────────
    await Promise.all([
      (async () => {
        await Promise.all(
          expiredQuotas.map(quota => {
            const target = expiredTargets.get(quota.id);
            if (!target || target.affectedUserIds.length === 0) return Promise.resolve();
            return QuotaNotificationService.sendQuotaExpired({
              affectedUserIds: target.affectedUserIds,
              quotaName: target.quotaName,
            });
          })
        );
        logger.info(`[QuotaExpirySweeper] Dispatched ${expiredQuotas.length} expired notifications.`);
      })(),
      (async () => {
        await Promise.all(
          expiringSoonQuotas.map(quota => {
            const target = expiringTargets.get(quota.id);
            if (!target || target.affectedUserIds.length === 0) return Promise.resolve();
            return QuotaNotificationService.sendQuotaExpiringSoon({
              affectedUserIds: target.affectedUserIds,
              quotaName: target.quotaName,
              validUntil: quota.validUntil ?? "",
              remaining: quota.remaining,
            });
          })
        );
        logger.info(`[QuotaExpirySweeper] Dispatched ${expiringSoonQuotas.length} expiring-soon notifications.`);
      })(),
      (async () => {
        await Promise.all(
          lowBalanceQuotas.map(quota => {
            const target = lowBalanceTargets.get(quota.id);
            if (!target || target.affectedUserIds.length === 0) return Promise.resolve();
            return QuotaNotificationService.sendQuotaLowBalance({
              affectedUserIds: target.affectedUserIds,
              studentName: target.studentName,
              remaining: quota.remaining,
              totalClasses: quota.totalClasses,
            });
          })
        );
        logger.info(`[QuotaExpirySweeper] Dispatched ${lowBalanceQuotas.length} low-balance notifications.`);
      })(),
    ]);

    logger.info("[QuotaExpirySweeper] Completed periodic quota refresh sweep.");
  } catch (error) {
    logger.error("[QuotaExpirySweeper] Error running quota expiry sweeper:", { error });
    throw error;
  }
}

if (import.meta.main) {
  runQuotaExpirySweeper()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
