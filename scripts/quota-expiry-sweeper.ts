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

/** Chunk size for parallel periodic-refresh processing inside the transaction. */
const PERIODIC_REFRESH_CHUNK_SIZE = 10;

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

/**
 * Queries quotas approaching expiry (ACTIVE, not deleted, validUntil within
 * the next EXPIRY_NOTICE_DAYS days). Uses UTC date arithmetic (V3-047) to
 * avoid server-local timezone skew. Guards against unbounded SELECTs via
 * MAX_EXPIRING_QUOTAS_PER_RUN.
 */
async function queryExpiringSoonQuotas(): Promise<QuotaSelectType[]> {
  const nowUtc = new Date();
  const todayStr = nowUtc.toISOString().slice(0, 10);

  const cutoffUtc = new Date(
    Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate() + EXPIRY_NOTICE_DAYS)
  );
  const cutoffStr = cutoffUtc.toISOString().slice(0, 10);

  return await db
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
}

/** Determines whether a refreshed quota qualifies as low-balance. */
function isLowBalance(quota: QuotaSelectType): boolean {
  const threshold = Math.max(
    Math.floor(quota.totalClasses * LOW_BALANCE_THRESHOLD_FRACTION),
    LOW_BALANCE_ABSOLUTE_FLOOR
  );
  return quota.remaining > 0 && quota.remaining <= threshold;
}

/**
 * Periodic refresh of all rollover-eligible quotas, executed inside a single
 * transaction. Processes refresh in parallel chunks of PERIODIC_REFRESH_CHUNK_SIZE
 * (Verify-6) to balance throughput against transaction limits. Returns the
 * subset of refreshed quotas that now qualify as low-balance.
 *
 * RCOMP-1: Calls QuotaService.listPeriodicForRollover (service layer) rather
 * than the repository directly, per the single-writer principle.
 */
async function refreshPeriodicAndCollectLowBalance(): Promise<QuotaSelectType[]> {
  const lowBalanceResults: QuotaSelectType[] = [];

  await db.transaction(async tx => {
    const periodicQuotas = await QuotaService.listPeriodicForRollover(tx);

    for (let i = 0; i < periodicQuotas.length; i += PERIODIC_REFRESH_CHUNK_SIZE) {
      const chunk = periodicQuotas.slice(i, i + PERIODIC_REFRESH_CHUNK_SIZE);
      const refreshedQuotas = await Promise.all(chunk.map(quota => QuotaService.refreshPeriodic(tx, quota.id, null)));

      for (const refreshed of refreshedQuotas) {
        if (isLowBalance(refreshed as QuotaSelectType)) {
          lowBalanceResults.push(refreshed as QuotaSelectType);
        }
      }
    }
  });

  return lowBalanceResults;
}

/**
 * Dispatches notifications for every quota whose target has at least one
 * affected user, building the notification payload via the supplied builder.
 * Shared by the expired / expiring-soon / low-balance dispatch paths to keep
 * the "skip if no affected users" guard logic in one place.
 */
async function dispatchQuotaNotifications<T extends QuotaReturnType | QuotaSelectType>(
  quotasList: T[],
  targets: Map<string, QuotaNotificationTarget>,
  buildNotification: (quota: T, target: QuotaNotificationTarget) => Promise<void>
): Promise<void> {
  await Promise.all(
    quotasList.map(async quota => {
      const target = targets.get(quota.id);
      if (!target || target.affectedUserIds.length === 0) return;
      await buildNotification(quota, target);
    })
  );
}

/** Builds an "expired" notification payload from a target's affected users. */
function buildExpiredNotification(_quota: QuotaReturnType, target: QuotaNotificationTarget): Promise<void> {
  return QuotaNotificationService.sendQuotaExpired({
    affectedUserIds: target.affectedUserIds,
    quotaName: target.quotaName,
  });
}

/** Builds an "expiring soon" notification payload from a quota and its target. */
function buildExpiringSoonNotification(quota: QuotaSelectType, target: QuotaNotificationTarget): Promise<void> {
  return QuotaNotificationService.sendQuotaExpiringSoon({
    affectedUserIds: target.affectedUserIds,
    quotaName: target.quotaName,
    validUntil: quota.validUntil ?? "",
    remaining: quota.remaining,
  });
}

/** Builds a "low balance" notification payload from a quota and its target. */
function buildLowBalanceNotification(quota: QuotaSelectType, target: QuotaNotificationTarget): Promise<void> {
  return QuotaNotificationService.sendQuotaLowBalance({
    affectedUserIds: target.affectedUserIds,
    studentName: target.studentName,
    remaining: quota.remaining,
    totalClasses: quota.totalClasses,
  });
}

export async function runQuotaExpirySweeper(): Promise<void> {
  logger.info("[QuotaExpirySweeper] Starting quota expiry & periodic refresh sweep...");
  try {
    // ── 1. Expire overdue quotas ───────────────────────────────────────────
    const expiredQuotas = await QuotaService.expireOverdueQuotas();
    logger.info(`[QuotaExpirySweeper] Expired ${expiredQuotas.length} overdue quotas.`);

    // ── 2. Query quotas approaching expiry (validUntil within N days) ──────
    const expiringSoonQuotas = await queryExpiringSoonQuotas();

    // ── 3. Resolve notification targets (parent userIds) for both sets ─────
    // RP2-7: Parallelise the independent resolveQuotaNotificationTargets calls.
    const [expiredTargets, expiringTargets] = await Promise.all([
      resolveQuotaNotificationTargets(expiredQuotas),
      resolveQuotaNotificationTargets(expiringSoonQuotas),
    ]);

    // ── 4. Periodic refresh + collect low-balance candidates ───────────────
    const lowBalanceQuotas = await refreshPeriodicAndCollectLowBalance();
    const lowBalanceTargets = await resolveQuotaNotificationTargets(lowBalanceQuotas);

    // ── 5. Dispatch notifications (after tx commits) ──────────────────────
    await Promise.all([
      dispatchQuotaNotifications(expiredQuotas, expiredTargets, buildExpiredNotification),
      dispatchQuotaNotifications(expiringSoonQuotas, expiringTargets, buildExpiringSoonNotification),
      dispatchQuotaNotifications(lowBalanceQuotas, lowBalanceTargets, buildLowBalanceNotification),
    ]);
    logger.info(`[QuotaExpirySweeper] Dispatched ${expiredQuotas.length} expired notifications.`);
    logger.info(`[QuotaExpirySweeper] Dispatched ${expiringSoonQuotas.length} expiring-soon notifications.`);
    logger.info(`[QuotaExpirySweeper] Dispatched ${lowBalanceQuotas.length} low-balance notifications.`);

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
