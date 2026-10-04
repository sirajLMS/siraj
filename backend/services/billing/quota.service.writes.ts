import { CreditRepository } from "@/backend/db/repo/billing/credit.repository";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { StudentRepository } from "@/backend/db/repo/students";
import { OnDemandStatus } from "@/backend/enum";
import { mapQuotaToReturnType } from "@/backend/lib";
import { QuotaNotFoundError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { runInTx } from "@/backend/services/billing/quota.service.helpers";
import type { DBTransaction, QuotaReturnType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/**
 * Recomputes which pending on-demand instances can be activated for a student
 * given their combined credit + quota balance, flips them in batches, and
 * deducts the backing quota/credit. Returns the number of instances flipped.
 */
export async function refreshStudentOndemandInstancesFlow(
  studentId: string,
  tx: DBTransaction | undefined,
  actorUserId: string | null | undefined,
  locale: string
): Promise<number> {
  // Permission check intentionally omitted: this method is called from
  // internal flows (CreditService, on-demand instance generator, class
  // lifecycle) where no user session exists. It mutates on-demand instance
  // states only, not quota data directly.
  return runInTx(tx, async t => {
    const creditBalance = await CreditRepository.getBalance(t, studentId);
    const openQuotas = await QuotaRepository.listActiveByStudent(t, studentId);
    const totalQuotaRemaining = openQuotas.reduce((sum, q) => sum + q.remaining, 0);

    const availableCredits = creditBalance.classesRemaining + totalQuotaRemaining;
    if (availableCredits <= 0) return 0;

    const pendingInstances = await SchedulingRepository.getOndemandPendingInstances(t, studentId, availableCredits);

    let flippedCount = 0;
    const now = new Date();

    // Single batched UPDATE for all pending instances (via repository).
    // The WHERE clause also guards on ondemandStatus = PENDING_CREDIT to
    // prevent a TOCTOU race: between the SELECT and UPDATE, a concurrent
    // transaction (e.g. session start) may have flipped an instance to
    // AVAILABLE. Without the guard, we'd overwrite it back to AVAILABLE and
    // over-count the flip, causing a credit leak.
    if (pendingInstances.length > 0) {
      const instanceIds = pendingInstances.map(inst => inst.id);
      flippedCount = await SchedulingRepository.updateOndemandStatusBatch(
        instanceIds,
        {
          executionState: "NOT_ACTIVATED",
          ondemandStatus: OnDemandStatus.AVAILABLE,
          updatedAt: now,
        },
        OnDemandStatus.PENDING_CREDIT,
        t
      );
    }

    // Deduct from quota for flipped instances to prevent double-counting on refresh.
    // `deductPendingRefresh` returns the number of classes it actually deducted from
    // quota. The remainder must come from the student's credit balance — otherwise
    // credit-only students get free classes (credit leak CR-1).
    if (flippedCount > 0) {
      const quotaDeducted = await QuotaRepository.deductPendingRefresh(t, {
        studentId,
        count: flippedCount,
        actorUserId: actorUserId ?? null,
      });

      const creditPortion = flippedCount - quotaDeducted;
      if (creditPortion > 0) {
        const tErrors = getServerTranslations(locale).errorsTranslations;
        if (creditBalance.classesRemaining < creditPortion) {
          throw new Error(
            tErrors.insufficientClasses({
              id: studentId,
              remaining: creditBalance.classesRemaining,
              required: creditPortion,
            })
          );
        }
        await StudentRepository.deductClasses(studentId, tErrors, creditPortion, undefined, t);
      }
    }

    logger.info({ studentId, flippedCount }, "Refreshed student on-demand instances");
    return flippedCount;
  });
}

export async function redeemForInstancesFlow(
  studentId: string,
  classInstanceIds: string[],
  quotaId: string,
  recurringScheduleId: string | null,
  actorUserId: string | null | undefined,
  tx: DBTransaction,
  locale: string
): Promise<{ redeemedCount: number; quota: QuotaReturnType | null }> {
  return runInTx(tx, async t => {
    if (classInstanceIds.length === 0) {
      return { redeemedCount: 0, quota: null };
    }

    const result = await QuotaRepository.redeemForInstanceBatch(t, {
      quotaId,
      studentId,
      recurringScheduleId,
      instanceIds: classInstanceIds,
      actorUserId,
    });

    if (result.redeemedCount === 0 && !result.quota) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new QuotaNotFoundError(tErrors.quotaNotFound);
    }

    // If redeemedCount === 0 but quota IS present, all instances were
    // already redeemed (idempotent dedup) — return gracefully.

    return {
      redeemedCount: result.redeemedCount,
      quota: result.quota ? mapQuotaToReturnType(result.quota) : null,
    };
  });
}

/**
 * Redeems a class instance against a specific quota, or the student's FIFO
 * quota when none is supplied. Throws when no backing quota exists.
 */
export async function redeemForInstanceFlow(
  studentId: string,
  classInstanceId: string,
  quotaId: string | null | undefined,
  actorUserId: string | null | undefined,
  tx: DBTransaction | undefined,
  locale: string
): Promise<QuotaReturnType> {
  return runInTx(tx, async t => {
    let targetQuotaId = quotaId;
    if (!targetQuotaId) {
      const fifoQuota = await QuotaRepository.selectQuotaForBookingFIFO(t, studentId);
      if (!fifoQuota) {
        const tErrors = getServerTranslations(locale).errorsTranslations;
        throw new QuotaNotFoundError(tErrors.quotaNotFound);
      }
      targetQuotaId = fifoQuota.id;
    }

    const idempotencyKey = QuotaRepository.deriveRedeemIdempotencyKey(classInstanceId, targetQuotaId);
    const updated = await QuotaRepository.redeemForInstance(t, {
      quotaId: targetQuotaId,
      studentId,
      classInstanceId,
      actorUserId,
      idempotencyKey,
    });
    return mapQuotaToReturnType(updated);
  });
}
