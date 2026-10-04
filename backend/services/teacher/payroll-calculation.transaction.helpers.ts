import { ClassStatusEventsRepository, SchedulingRepository } from "@/backend/db/repo/scheduling";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { CalculationStatus } from "@/backend/enum";
import { DomainError, logger, NotFoundError, sanitizePlainText } from "@/backend/lib";
import { classifyPayrollBranch } from "@/backend/services/teacher/payroll-calculation.branch.helpers";
import {
  IDEMPOTENCY_WINDOW_SECONDS,
  PAYROLL_OVERRIDE_EVENT_TYPE,
  PAYROLL_STATUS_TRANSITION_EVENT_TYPE,
  STICKY_STATUSES,
} from "@/backend/services/teacher/payroll-calculation.constants";
import {
  buildOverridePatch,
  type OverrideTransactionOutcome,
} from "@/backend/services/teacher/payroll-calculation.override.helpers";
import {
  buildFreshCalculationPatch,
  buildPayrollEventRow,
  deriveCalculationIdempotencyKey,
  insertPayrollEvent,
  mapToCalculationResult,
  mapToOverrideResult,
} from "@/backend/services/teacher/payroll-calculation.snapshot.helpers";
import { resolveGraceSettings } from "@/backend/services/teacher/payroll-grace-settings";
import type {
  ClassInstanceSelectType,
  DBTransaction,
  PayrollCalculationInput,
  PayrollCalculationResult,
  PayrollOverrideInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Loads the instance for a payroll write, row-locked with FOR UPDATE so every
 * status decision and the snapshot write happen under the lock.
 *
 * Lock-ordering rule: a standalone payroll run takes the teacher-scoped
 * advisory lock FIRST and only then the row lock, serializing concurrent
 * calculators and overrides for one teacher (batch runs included). A run
 * embedded in a caller-provided transaction (the scheduling state machine)
 * must SKIP the advisory lock: that caller already holds the instance row
 * lock from its transition update, and waiting on the advisory while holding
 * the row would invert the standalone order — a transaction holding a row
 * lock blocking on the advisory while a standalone run holds the advisory
 * and blocks on the same row is the classic two-lock deadlock. The embedded
 * path never waits on the advisory, so it always makes progress and releases
 * the row, keeping both paths acyclic; per-instance serialization is
 * preserved by the row lock either way.
 */
async function lockInstanceForPayroll(
  tx: DBTransaction,
  instanceId: string,
  tErrors: ErrorsLabels,
  options: { advisoryLock: boolean }
): Promise<ClassInstanceSelectType> {
  if (options.advisoryLock) {
    // Unlocked pre-read: only supplies the teacher id for the lock key.
    const snapshot = await SchedulingRepository.getById(instanceId, tx);
    if (!snapshot) {
      throw new NotFoundError("CLASS_INSTANCE", tErrors.scheduling.classInstanceNotFound({ id: instanceId }));
    }
    await acquireAdvisoryLock(tx, `payroll_teacher_${snapshot.teacherId}`);
  }
  const locked = await SchedulingRepository.getById(instanceId, tx, { forUpdate: true });
  if (!locked) {
    throw new NotFoundError("CLASS_INSTANCE", tErrors.scheduling.classInstanceNotFound({ id: instanceId }));
  }
  return locked;
}

export async function calculateWithinTransaction(
  tx: DBTransaction,
  input: PayrollCalculationInput,
  tErrors: ErrorsLabels,
  lockOptions: { advisoryLock: boolean }
): Promise<PayrollCalculationResult> {
  const instance = await lockInstanceForPayroll(tx, input.instanceId, tErrors, lockOptions);
  const previousStatus = instance.calculationStatus;

  // Settled money is immutable — payment history must never be recalculated away.
  if (previousStatus === CalculationStatus.PAID) {
    throw new DomainError("PAYROLL_ALREADY_PAID", tErrors.payroll.alreadyPaid);
  }

  // Settlement states are sticky unless the caller forces a recalculation;
  // the current snapshot is returned untouched.
  if (STICKY_STATUSES.has(previousStatus) && !input.forceRecalc) {
    const grace = await resolveGraceSettings(tx);
    return mapToCalculationResult(instance, classifyPayrollBranch(instance, grace));
  }

  const { patch, branch } = await buildFreshCalculationPatch(tx, instance, input.actorUserId, tErrors);

  const idempotencyKey = deriveCalculationIdempotencyKey(
    input.instanceId,
    patch.calculationStatus,
    patch.calculatedDuration,
    patch.teacherPaidAmount
  );
  const existingEvent = await ClassStatusEventsRepository.findRecentByInstanceAndHash(
    input.instanceId,
    idempotencyKey,
    IDEMPOTENCY_WINDOW_SECONDS,
    tx
  );
  if (existingEvent) {
    return mapToCalculationResult(instance, branch);
  }

  const updated = await SchedulingRepository.updatePayrollCalculation(tx, input.instanceId, patch);
  if (!updated) {
    throw new DomainError("PAYROLL_UPDATE_FAILED", tErrors.internalServerError);
  }

  await insertPayrollEvent(
    tx,
    buildPayrollEventRow({
      classInstanceId: input.instanceId,
      eventType: PAYROLL_STATUS_TRANSITION_EVENT_TYPE,
      previous: instance,
      patch,
      description: patch.payrollNote ?? null,
      actorUserId: input.actorUserId,
      idempotencyKey,
    }),
    tErrors
  );

  if (patch.calculationStatus === CalculationStatus.CALCULATED) {
    logger.info("Payroll calculation snapshot written", {
      actorUserId: input.actorUserId,
      instanceId: input.instanceId,
      previousStatus,
      newStatus: patch.calculationStatus,
      amount: patch.teacherPaidAmount,
      calculatedDuration: patch.calculatedDuration,
      isStudentAbsence: branch.isStudentAbsence,
      isTeacherAbsence: branch.isTeacherAbsence,
      isWithinGrace: branch.isWithinGrace,
      isProRated: branch.isProRated,
    });
  } else {
    logger.warn("Payroll calculation degraded to NOT_CALCULATED", {
      actorUserId: input.actorUserId,
      instanceId: input.instanceId,
      previousStatus,
      newStatus: patch.calculationStatus,
      amount: patch.teacherPaidAmount,
      payrollNote: patch.payrollNote,
    });
  }

  return mapToCalculationResult(updated, branch);
}

export async function applyOverrideWithinTransaction(
  tx: DBTransaction,
  input: PayrollOverrideInput,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<OverrideTransactionOutcome> {
  const instance = await lockInstanceForPayroll(tx, input.instanceId, tErrors, { advisoryLock: true });
  const previousStatus = instance.calculationStatus;

  if (previousStatus === CalculationStatus.PAID) {
    throw new DomainError("PAYROLL_ALREADY_PAID", tErrors.payroll.alreadyPaid);
  }
  if (previousStatus === CalculationStatus.WAITING_PAID && !input.force) {
    throw new DomainError("PAYROLL_AWAITING_SETTLEMENT", tErrors.payroll.awaitingSettlement);
  }

  const existingEvent = await ClassStatusEventsRepository.findRecentByInstanceAndHash(
    input.instanceId,
    idempotencyKey,
    IDEMPOTENCY_WINDOW_SECONDS,
    tx
  );
  if (existingEvent) {
    return { result: mapToOverrideResult(instance, existingEvent.id), auditContext: null };
  }

  const sanitizedNote = input.note ? sanitizePlainText(input.note) : null;
  const patch = await buildOverridePatch(tx, instance, input, sanitizedNote, tErrors);

  const updated = await SchedulingRepository.updatePayrollCalculation(tx, input.instanceId, patch);
  if (!updated) {
    throw new DomainError("PAYROLL_UPDATE_FAILED", tErrors.internalServerError);
  }

  const auditEventId = await insertPayrollEvent(
    tx,
    buildPayrollEventRow({
      classInstanceId: input.instanceId,
      eventType: PAYROLL_OVERRIDE_EVENT_TYPE,
      previous: instance,
      patch,
      description: sanitizedNote,
      actorUserId: input.actorUserId,
      idempotencyKey,
    }),
    tErrors
  );

  logger.info("Payroll override applied", {
    actorUserId: input.actorUserId,
    instanceId: input.instanceId,
    previousStatus,
    newStatus: patch.calculationStatus,
    amount: patch.teacherPaidAmount,
  });

  return {
    result: mapToOverrideResult(updated, auditEventId),
    auditContext: {
      previousStatus,
      newStatus: patch.calculationStatus,
      amount: patch.teacherPaidAmount ?? null,
      partialPercentage: patch.isPartialPercentage ?? null,
      payrollEventId: auditEventId,
    },
  };
}
