import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { quotas } from "@/backend/db/schema";
import { QuotaStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { QuotaNotificationService } from "@/backend/services/billing/quota-notification.service";
import type { QuotaReturnType, QuotaSelectType } from "@/backend/types/billing/quota.types";
import { resolveStudentNotificationRecipients } from "@/scripts/lib/resolve-notification-recipients";

/** Quotas with validUntil within this many days are considered "expiring soon". */
const EXPIRY_NOTICE_DAYS = 7;

/** Low-balance threshold: remaining <= this fraction of totalClasses triggers a notification. */
const LOW_BALANCE_THRESHOLD_FRACTION = 0.2;

/** Low-balance absolute floor: always notify if remaining drops to/below this many classes. */
const LOW_BALANCE_ABSOLUTE_FLOOR = 3;

/** Maximum number of expiring quotas to process per sweeper run (unbounded SELECT guard — RP2-9). */
const MAX_EXPIRING_QUOTAS_PER_RUN = 500;

/**
 * Notification target for a single quota: the affected user IDs (parent or
 * student), the quota's display name, and the student's display name.
 */
interface QuotaNotificationTarget {
  affectedUserIds: string[];
  quotaName: string;
  studentName: string;
}

/**
 * Resolves the notification targets for each quota's studentId using the
 * shared resolveStudentNotificationRecipients utility, which batches
 * the student + parent lookups. Returns a Map keyed by quotaId. When no
 * parent is linked, falls back to the student's own userId so the
 * notification still reaches a user.
 */
async function resolveQuotaNotificationTargets(
  quotaRows: QuotaReturnType[] | QuotaSelectType[]
): Promise<Map<string, QuotaNotificationTarget>> {
  if (quotaRows.length === 0) return new Map();

  const studentIds = [...new Set(quotaRows.map(q => q.studentId))];

  // Delegate to the shared utility which performs batch lookups and
  // notification preference resolution.
  const recipientMap = await resolveStudentNotificationRecipients(studentIds);

  const result = new Map<string, QuotaNotificationTarget>();
  for (const q of quotaRows) {
    const recipient = recipientMap.get(q.studentId);
    if (!recipient) continue;

    result.set(q.id, {
      affectedUserIds: recipient.affectedUserIds,
      quotaName: q.name,
      studentName: recipient.studentName,
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
    // V3-047: Use UTC date arithmetic to avoid server-local timezone skew.
    const nowUtc = new Date();
    const todayStr = nowUtc.toISOString().slice(0, 10);

    const cutoffUtc = new Date(
      Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate() + EXPIRY_NOTICE_DAYS)
    );
    const cutoffStr = cutoffUtc.toISOString().slice(0, 10);

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

      // Verify-6: Process periodic refresh in parallel chunks of 10 to avoid
      // sequential await overhead while staying within transaction limits.
      const CHUNK_SIZE = 10;
      const lowBalanceResults: QuotaSelectType[] = [];

      for (let i = 0; i < periodicQuotas.length; i += CHUNK_SIZE) {
        const chunk = periodicQuotas.slice(i, i + CHUNK_SIZE);
        const refreshedQuotas = await Promise.all(chunk.map(quota => QuotaService.refreshPeriodic(tx, quota.id, null)));

        for (const refreshed of refreshedQuotas) {
          const threshold = Math.max(
            Math.floor(refreshed.totalClasses * LOW_BALANCE_THRESHOLD_FRACTION),
            LOW_BALANCE_ABSOLUTE_FLOOR
          );
          if (refreshed.remaining > 0 && refreshed.remaining <= threshold) {
            lowBalanceResults.push(refreshed as QuotaSelectType);
          }
        }
      }

      lowBalanceQuotas.push(...lowBalanceResults);
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
