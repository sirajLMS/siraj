import { RecurringScheduleRepository, SchedulingRepository } from "@/backend/db/repo/scheduling";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { logger } from "@/backend/lib/logger";
import { CreditService } from "@/backend/services/billing/credit.service";
import { QuotaService } from "@/backend/services/billing/quota.service";
import type { ClassInstanceSelectType, DBTransaction } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations, type SessionLabels } from "@/shared/locale";

async function refundCreditIfDeducted(
  instance: { id: string; studentId: string; quotaDeducted: boolean | null },
  actorUserId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction
): Promise<boolean> {
  if (!instance.quotaDeducted) return false;
  const idempotencyKey = `credit-refund:${instance.id}`;
  await CreditService.refundOnCancel(instance.studentId, instance.id, actorUserId, idempotencyKey, tx, tErrors);
  return true;
}

/**
 * Release quota for a quota-deducted class instance. The quotaId is resolved
 * from the class instance's parent recurring schedule.
 *
 * `quotaReleased` is `true` only when the quota pool was successfully
 * released. Returns `false` when the instance is not quota-deducted, when
 * `recurringScheduleId` is missing (the holder can't be resolved and the
 * instance should NOT fall through to a spurious credit refund), or when the
 * release itself failed. `quotaId` carries the resolved quota when a release
 * actually happened, so callers that need to re-deduct against the same quota
 * (e.g. `reschedule`) can do so. `isQuotaBacked` is `true` when the schedule
 * had a real `quotaId` and an actual release was attempted; callers handling
 * the credit-backed fallback should gate on `!isQuotaBacked` so a genuine
 * quota-release failure does not trigger a phantom credit refund.
 */
async function releaseQuotaIfDeducted(
  instance: Pick<ClassInstanceSelectType, "id" | "studentId" | "quotaDeducted" | "recurringScheduleId">,
  actorUserId: string,
  tx: DBTransaction,
  locale = "en"
): Promise<{ quotaReleased: boolean; quotaId: string | null; isQuotaBacked: boolean; warning: string | null }> {
  if (!instance.quotaDeducted) return { quotaReleased: false, quotaId: null, isQuotaBacked: false, warning: null };
  if (!instance.recurringScheduleId) {
    const warning = "quota_release_skipped_no_schedule";
    logger.logDomainError(warning, {
      classInstanceId: instance.id,
      studentId: instance.studentId,
    });
    return { quotaReleased: false, quotaId: null, isQuotaBacked: false, warning };
  }

  const scheduleRow = await RecurringScheduleRepository.findById(instance.recurringScheduleId, tx);
  const quotaId = scheduleRow?.schedule.quotaId ?? null;

  if (!quotaId) return { quotaReleased: false, quotaId: null, isQuotaBacked: false, warning: null };

  const result = await QuotaService.tryReleaseForInstance(
    instance.studentId,
    instance.id,
    quotaId,
    actorUserId,
    tx,
    locale
  );
  return { quotaReleased: result.ok, quotaId: result.ok ? quotaId : null, isQuotaBacked: true, warning: null };
}

export async function handleOndemandSessionStartCreditDeduction(
  instance: ClassInstanceSelectType,
  userId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction,
  locale = "en"
): Promise<void> {
  if (instance.ondemandStatus === "PENDING_CREDIT") {
    const openQuota = await QuotaService.selectQuotaForBooking(instance.studentId, tx, userId, locale);
    if (openQuota) {
      await QuotaService.redeemForInstance(instance.studentId, instance.id, openQuota.id, userId, tx, locale);
    } else {
      const idempotencyKey = `credit-deduction-ondemand:${instance.id}`;
      await CreditService.deductForBooking(instance.studentId, instance.id, userId, idempotencyKey, tx, tErrors);
    }
  }
}

/**
 * Release quota for a quota-deducted instance and fall back to a credit refund
 * when no quota pool was released (credit-backed bookings). Shared by every
 * cancellation-style transition (delete, leave, reset).
 */
export async function settleQuotaOnQuotaDeducted(
  instance: ClassInstanceSelectType,
  actorUserId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction
): Promise<string | null> {
  if (!instance.quotaDeducted) return null;
  const { quotaReleased, warning } = await releaseQuotaIfDeducted(instance, actorUserId, tx);
  if (!quotaReleased) {
    await refundCreditIfDeducted(instance, actorUserId, tErrors, tx);
  }
  return warning;
}

/**
 * Compute a teacher-leave quota warning note for the reschedule. Returns
 * `null` when the existing instance has no teacher or the leave quota is
 * not yet exhausted.
 */
export async function computeLeaveQuotaNote(teacherId: string | null, tSession: SessionLabels): Promise<string | null> {
  if (!teacherId) return null;

  const now = new Date();
  const periodYear = now.getUTCFullYear();
  const periodMonth = now.getUTCMonth() + 1;
  const maxLeaves = await SystemSettingsRepository.getIntValue("teacher_max_leaves", 2);
  const usedLeaves = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacherId, periodYear, periodMonth);

  if (usedLeaves >= maxLeaves) {
    return tSession.teacherQuotaExhaustedNote(usedLeaves, maxLeaves);
  }
  return null;
}

/**
 * Combine existing remarks with an appended quota note (if any). Existing
 * remarks are preserved verbatim; the quota note is joined on its own line.
 * Returns `null` when both are absent.
 */
export function buildRescheduleRemarks(existingRemarks: string | null, quotaNote: string | null): string | null {
  const parts: string[] = [];
  if (existingRemarks) parts.push(existingRemarks);
  if (quotaNote) parts.push(quotaNote);
  return parts.length > 0 ? parts.join("\n") : null;
}

/**
 * Assemble the successor instance insert payload for `reschedule`. Copies
 * identity/billing fields from the existing instance, resets lifecycle flags,
 * and stamps a unique idempotency key derived from the new start time.
 */
export function buildRescheduleInsert(
  classInstanceId: string,
  existing: ClassInstanceSelectType,
  input: { scheduledStartAt: Date; scheduledEndAt: Date; durationMinutes: number },
  finalRemarks: string | null
) {
  const idempotencyKey = `manual-reschedule-${classInstanceId}-${input.scheduledStartAt.toISOString()}`;
  return {
    studentId: existing.studentId,
    teacherId: existing.teacherId,
    subjectId: existing.subjectId,
    recurringScheduleId: existing.recurringScheduleId,
    scheduledStartAt: input.scheduledStartAt,
    scheduledEndAt: input.scheduledEndAt,
    durationMinutes: input.durationMinutes,
    classType: existing.classType,
    executionState: "NOT_ACTIVATED" as const,
    outcome: "PENDING" as const,
    isRescheduled: false,
    quotaDeducted: false,
    payrollCredited: false,
    rateAmount: existing.rateAmount,
    rateCurrency: existing.rateCurrency,
    isRateOverridden: existing.isRateOverridden,
    remarks: finalRemarks,
    idempotencyKey,
  };
}

/**
 * Re-deduct the quota/credit against the successor instance that was refunded
 * from the original. Without this step the reschedule leaks a free class: the
 * original is refunded, but the successor is inserted with
 * `quotaDeducted: false` and never charged again. Credit is refunded only when
 * the instance is NOT quota-backed — a genuine quota-release failure on a
 * quota-backed instance must not also trigger a phantom credit refund.
 */
export async function applyRescheduleSettlement(
  existing: Pick<ClassInstanceSelectType, "id" | "studentId" | "quotaDeducted" | "recurringScheduleId" | "deletedAt">,
  newInstance: { id: string; studentId: string },
  userId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction,
  locale: string
): Promise<void> {
  if (!existing.quotaDeducted || existing.deletedAt !== null) return;

  const { quotaId, isQuotaBacked } = await releaseQuotaIfDeducted(existing, userId, tx, locale);
  const creditRefunded =
    !isQuotaBacked &&
    (await refundCreditIfDeducted(existing, userId, getServerTranslations(locale).errorsTranslations, tx));

  if (quotaId) {
    await QuotaService.redeemForInstance(newInstance.studentId, newInstance.id, quotaId, userId, tx, locale);
    await SchedulingRepository.setQuotaDeducted(newInstance.id, true, tx);
    return;
  }

  if (creditRefunded) {
    const deductIdempotencyKey = `credit-deduction:${newInstance.id}`;
    await CreditService.deductForBooking(
      newInstance.studentId,
      newInstance.id,
      userId,
      deductIdempotencyKey,
      tx,
      tErrors
    );
    await SchedulingRepository.setQuotaDeducted(newInstance.id, true, tx);
  }
}
