import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { NotificationEventType } from "@/backend/enum";
import { NotFoundError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import {
  checkStateChangeAuth,
  validateStateTransition,
} from "@/backend/services/scheduling/state-change-validation.service";
import { notifyClassLifecycle } from "@/backend/services/session/class-session.helpers";
import {
  handleOndemandSessionStartCreditDeduction,
  settleQuotaOnQuotaDeducted,
} from "@/backend/services/session/class-session-billing.helpers";
import { triggerTerminalPayrollCalculation } from "@/backend/services/session/class-session-payroll.helpers";
import type { ClassInstanceSelectType, DBTransaction } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

const stateChangeCallbacks = {
  onAuth: checkStateChangeAuth,
  onValidate: validateStateTransition,
};

async function triggerPayrollIfCompleted(
  updated: ClassInstanceSelectType | null,
  userId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction
) {
  if (updated) {
    await triggerTerminalPayrollCalculation(updated, userId, tErrors, tx);
  }
}

export async function stopClassInstanceTx(
  classInstanceId: string,
  userId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction
) {
  const updated = await SchedulingRepository.stopClassInstance(
    classInstanceId,
    userId,
    tx,
    tErrors,
    stateChangeCallbacks
  );
  await triggerPayrollIfCompleted(updated, userId, tErrors, tx);
  return updated;
}

export async function markAbsentTx(classInstanceId: string, userId: string, tErrors: ErrorsLabels, tx: DBTransaction) {
  const absent = await SchedulingRepository.markClassAbsent(classInstanceId, userId, tx, tErrors, stateChangeCallbacks);
  if (!absent) return null;
  await triggerTerminalPayrollCalculation(absent, userId, tErrors, tx);
  return absent;
}

export async function activateClassInstanceTx(
  instance: ClassInstanceSelectType,
  userId: string,
  classInstanceId: string,
  tErrors: ErrorsLabels,
  force: boolean,
  locale: string,
  tx: DBTransaction
) {
  await handleOndemandSessionStartCreditDeduction(instance, userId, tErrors, tx, locale);
  return SchedulingRepository.activateClassInstance(
    classInstanceId,
    userId,
    { force },
    tx,
    tErrors,
    stateChangeCallbacks
  );
}

export async function processLeaveTx(
  instance: ClassInstanceSelectType,
  classInstanceId: string,
  reason: string | null,
  userId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction
) {
  const meeting = await EffectiveMeetingService.resolveForNewBooking(instance.teacherId, { tErrors, tx });
  const processed = await SchedulingRepository.processClassLeave(
    classInstanceId,
    reason ?? null,
    userId,
    tx,
    tErrors,
    stateChangeCallbacks,
    meeting.joinUrl
  );
  await settleQuotaOnQuotaDeducted(instance, userId, tErrors, tx);
  const completedOriginal = await SchedulingRepository.getById(processed.originalId, tx);
  await triggerPayrollIfCompleted(completedOriginal, userId, tErrors, tx);
  return processed;
}

export async function deleteInstanceTx(
  instance: ClassInstanceSelectType,
  classInstanceId: string,
  userId: string,
  tErrors: ErrorsLabels,
  warnings: string[],
  tx: DBTransaction
): Promise<boolean> {
  const deleted = await SchedulingRepository.softDeleteClassInstance(classInstanceId, userId, tx);
  if (!deleted) return false;

  if (instance.quotaDeducted && instance.deletedAt === null) {
    const warning = await settleQuotaOnQuotaDeducted(instance, userId, tErrors, tx);
    if (warning) warnings.push(warning);
  }
  return true;
}

export async function resetClassInstanceTx(
  instance: ClassInstanceSelectType,
  classInstanceId: string,
  userId: string,
  tErrors: ErrorsLabels,
  tx: DBTransaction
) {
  const resetResult = await SchedulingRepository.resetClassInstance(
    classInstanceId,
    userId,
    tx,
    tErrors,
    stateChangeCallbacks
  );
  if (!resetResult) {
    throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
  }
  await settleQuotaOnQuotaDeducted(instance, userId, tErrors, tx);
  return resetResult;
}

export async function overrideRateTx(
  classInstanceId: string,
  rateAmount: string | null,
  rateCurrency: CurrencyCode | null,
  tErrors: ErrorsLabels,
  tx: DBTransaction
): Promise<void> {
  const result = await SchedulingRepository.overrideClassInstanceRate(classInstanceId, rateAmount, rateCurrency, tx);
  if (!result) {
    throw new NotFoundError("CLASS_INSTANCE", tErrors.notFound);
  }
}

export async function attachMeetingForRescheduledInstance(classInstanceId: string): Promise<void> {
  try {
    await MeetingConfigSnapshotService.generateAndAttachForClassInstance(classInstanceId);
  } catch (error) {
    logger.error("Booking-time meeting URL generation failed for rescheduled class instance", {
      classInstanceId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function dispatchRescheduleLifecycle(
  newInstanceId: string,
  originalInstanceId: string,
  scheduledStartAt: Date,
  userId: string
): Promise<void> {
  try {
    await notifyClassLifecycle(
      newInstanceId,
      NotificationEventType.CLASS_RESCHEDULED,
      await SchedulingRepository.getClassInstanceAffectedUsers(newInstanceId),
      {
        newStartAt: scheduledStartAt.toISOString(),
        originalInstanceId,
      }
    );
  } catch (error) {
    logger.error("Failed to dispatch reschedule notification", {
      userId,
      classInstanceId: originalInstanceId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
