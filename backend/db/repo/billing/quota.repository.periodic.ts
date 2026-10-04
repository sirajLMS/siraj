import { and, desc, eq, gt, gte, isNull, sql } from "drizzle-orm";

import { withForUpdate } from "@/backend/db";
import {
  deriveExpireIdempotencyKey,
  deriveIdempotencyKey,
  derivePeriodicGrantIdempotencyKey,
} from "@/backend/db/repo/billing/quota.repository.helpers";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { quotas } from "@/backend/db/schema";
import { QuotaLedgerReason, QuotaStatus } from "@/backend/enum";
import { ConflictError, QuotaNotFoundError } from "@/backend/lib/errors";
import { mapQuotaToReturnType } from "@/backend/lib/quota-mapping";
import type { DBTransaction, QuotaReturnType, QuotaSelectType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

/**
 * Data-access method that applies a pre-computed periodic refresh to a single
 * quota row.  All business-rule computation (rollover amount, period
 * advancement, validation) must be performed by the caller
 * (see `QuotaService.refreshPeriodic`) before invoking this method.
 *
 * Expects:
 * - `target`   — the locked quota row (SELECT … FOR UPDATE already done by caller)
 * - `newRemaining`, `newAnchor`, `expiredAmount`, `periodStr` — pre-computed by the service
 *
 * The method performs the version-checked UPDATE and the deferred ledger
 * INSERTs (EXPIRE + GRANT) for audit-trail completeness (RB‑11).
 */
export const applyRefreshPeriodicImpl = async (
  tx: DBTransaction,
  target: QuotaSelectType,
  input: {
    newRemaining: number;
    newAnchor: Date;
    expiredAmount: number;
    periodStr: string;
    actorUserId?: string | null;
  },
  locale?: string
): Promise<QuotaReturnType> => {
  const now = new Date();
  const { newRemaining, newAnchor, expiredAmount, periodStr, actorUserId } = input;

  // Version-checked UPDATE first. Ledger INSERTs are deferred to AFTER the UPDATE
  // succeeds so that a conflict (concurrent write) rolls back cleanly without
  // orphaning ledger entries (RB-11).
  const [updated] = await tx
    .update(quotas)
    .set({
      remaining: newRemaining,
      reservedClasses: 0,
      usedThisPeriod: 0,
      periodAnchor: newAnchor,
      version: target.version + 1,
      updatedAt: now,
    })
    .where(and(eq(quotas.id, target.id), eq(quotas.version, target.version)))
    .returning();

  if (!updated) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new ConflictError(tErrors.billing.quotaRefreshConcurrentWrite);
  }

  // After UPDATE succeeds: insert deferred ledger entries.
  // EXPIRE the unused classes that did not roll over from the just-ended period
  if (expiredAmount > 0) {
    const expireKey = deriveExpireIdempotencyKey(target.id, periodStr);
    // AUDIT: ledger entry required for EXPIRE tracking and balance reconstruction
    await QuotaLedgerRepository.insert(tx, {
      quotaId: target.id,
      studentId: target.studentId,
      delta: -expiredAmount,
      reason: QuotaLedgerReason.EXPIRE,
      reasonNote: `Periodic refresh: expired ${expiredAmount} unused classes (period ending ${periodStr})`,
      actorUserId: actorUserId ?? null,
      idempotencyKey: expireKey,
    });
  }

  // GRANT the full replenishment for the new period (per-period idempotency key
  // so grants from different periods never collide).
  // AUDIT: ledger entry required for GRANT tracking and balance reconstruction
  const grantKey = derivePeriodicGrantIdempotencyKey(target.id, periodStr);
  await QuotaLedgerRepository.insert(tx, {
    quotaId: target.id,
    studentId: target.studentId,
    delta: target.totalClasses,
    reason: QuotaLedgerReason.GRANT,
    reasonNote: `Periodic refresh: granted ${target.totalClasses} classes for new period`,
    actorUserId: actorUserId ?? null,
    idempotencyKey: grantKey,
  });

  return mapQuotaToReturnType(updated);
};

/**
 * Deducts from the highest-priority active quota(s) up to the given count.
 * Used during on-demand instance refresh to prevent double-counting credits.
 * Deducts atomically (remaining >= 1 check in WHERE) across quotas ordered by priority.
 */
export const deductPendingRefreshImpl = async (
  tx: DBTransaction,
  input: {
    studentId: string;
    count: number;
    actorUserId?: string | null;
  }
): Promise<number> => {
  // Lock quota rows for the duration of this transaction to prevent TOCTOU races (RB-10).
  const activeQuotas = await withForUpdate(
    tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gt(quotas.remaining, 0),
          isNull(quotas.deletedAt)
        )
      )
      .orderBy(desc(quotas.priority))
  );

  // Pre-compute the per-quota deductions sequentially (no awaits) so the loop
  // can break early once the requested count is fully allocated across quotas
  // ordered by priority. The rows are already locked by `FOR UPDATE`, so the
  // subsequent writes can be dispatched in parallel without TOCTOU races.
  const plannedDeductions: Array<{ quota: (typeof activeQuotas)[number]; toTake: number; index: number }> = [];
  let remainingToDeduct = input.count;
  for (let i = 0; i < activeQuotas.length; i++) {
    const quota = activeQuotas[i];
    if (remainingToDeduct <= 0) break;
    const toTake = Math.min(remainingToDeduct, quota.remaining);
    plannedDeductions.push({ quota, toTake, index: i });
    remainingToDeduct -= toTake;
  }

  const now = new Date();

  const deductions = await Promise.all(
    plannedDeductions.map(async ({ quota, toTake, index }) => {
      const [updated] = await tx
        .update(quotas)
        .set({
          remaining: sql<number>`${quotas.remaining} - ${toTake}`,
          usedThisPeriod: sql<number>`${quotas.usedThisPeriod} + ${toTake}`,
          version: sql<number>`${quotas.version} + 1`,
          updatedAt: now,
        })
        .where(
          and(
            eq(quotas.id, quota.id),
            eq(quotas.status, QuotaStatus.ACTIVE),
            gte(quotas.remaining, toTake),
            isNull(quotas.deletedAt)
          )
        )
        .returning();

      if (!updated) return 0;

      // Deterministic idempotency key based on quota ID, period, and deduction sequence
      // index so each levy within a call produces a unique key (RBL2-6).
      // Using the quota's current periodAnchor as the period key avoids the non-deterministic
      // now.toISOString(), while the index suffix differentiates per-quota deductions within
      // the same refresh cycle, preventing ON CONFLICT DO NOTHING from swallowing audit rows.
      // AUDIT: ledger entry required for ADJUST deduction tracking and balance reconstruction
      const periodKey = (quota.periodAnchor ?? quota.createdAt).toISOString().slice(0, 10);
      await QuotaLedgerRepository.insert(tx, {
        quotaId: quota.id,
        studentId: input.studentId,
        delta: -toTake,
        reason: QuotaLedgerReason.ADJUST,
        reasonNote: `Deducted ${toTake} for on-demand refresh`,
        actorUserId: input.actorUserId ?? null,
        idempotencyKey: deriveIdempotencyKey("refresh-deduct", quota.id, periodKey, String(index)),
      });

      return toTake;
    })
  );

  return deductions.reduce((total, value) => total + value, 0);
};

/** @internal — Used by tests for per-period reset assertions. Production rollover uses refreshPeriodic.
 *
 * Resets `usedThisPeriod` to 0 for a single quota.
 *
 * Uses optimistic concurrency via `version`. Inserts an `ADJUST`
 * ledger entry (delta=0) for audit-trail completeness. Idempotent via
 * a deterministic SHA-256 key scoped to the quota + period string.
 */
export const resetUsedThisPeriodImpl = async (
  tx: DBTransaction,
  quotaId: string,
  periodStr: string,
  actorUserId?: string | null,
  locale?: string
): Promise<QuotaSelectType> => {
  const [existing] = await withForUpdate(
    tx
      .select()
      .from(quotas)
      .where(and(eq(quotas.id, quotaId), isNull(quotas.deletedAt)))
  ).limit(1);
  if (!existing) throw new QuotaNotFoundError("Quota not found");

  const [updated] = await tx
    .update(quotas)
    .set({
      usedThisPeriod: 0,
      version: sql<number>`${quotas.version} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(quotas.id, quotaId), eq(quotas.version, existing.version)))
    .returning();

  if (!updated) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new ConflictError(tErrors.billing.quotaResetConcurrentModification);
  }

  // AUDIT: ledger entry required for ADJUST tracking and balance reconstruction
  await QuotaLedgerRepository.insert(tx, {
    quotaId,
    studentId: existing.studentId,
    delta: 0,
    reason: QuotaLedgerReason.ADJUST,
    reasonNote: `Reset usedThisPeriod for period ${periodStr}`,
    actorUserId: actorUserId ?? null,
    idempotencyKey: deriveIdempotencyKey("reset-used", quotaId, periodStr),
  });

  return updated;
};
