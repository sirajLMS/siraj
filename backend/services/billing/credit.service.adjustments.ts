import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo/billing";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { StudentRepository } from "@/backend/db/repo/students";
import { CreditAdjustmentType, CreditReason } from "@/backend/enum";
import { logger, ValidationError } from "@/backend/lib";
import { maybeInsertCarryoverBalanceEntry } from "@/backend/services/billing/carryover-handoff";
import {
  assertActiveStudentExists,
  assertSufficientClasses,
  assertTeacherExists,
  isUniqueViolation,
  mapToAdjustmentReturnType,
  normalizeInternalNotes,
  sanitizeAdjustmentNotes,
} from "@/backend/services/billing/credit.service.helpers";
import { deriveAdjustmentIdempotencyKey } from "@/backend/services/billing/credit-adjustment.idempotency";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { AuditService } from "@/backend/services/system/audit.service";
import type {
  AdjustmentTxParams,
  AdjustmentTxResult,
  CarryoverBlock,
  CreateAuditLogInput,
  CreditAdjustmentInput,
  CreditAdjustmentReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Sanity cap for the operator-internal plain-text note (accounting-only). */
const INTERNAL_NOTES_MAX_LENGTH = 2000;

/** Narrows the optional carryover fields, failing validation when any is missing. */
function requireCarryoverBlock(input: CreditAdjustmentInput, tErrors: ErrorsLabels): CarryoverBlock {
  const { carryoverTeacherId, carryoverFromDate, carryoverToDate, carryoverPaymentDate } = input;
  const teacherId = carryoverTeacherId?.trim();
  if (!teacherId || !carryoverFromDate || !carryoverToDate || !carryoverPaymentDate) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
  return {
    teacherId,
    fromDate: carryoverFromDate,
    toDate: carryoverToDate,
    paymentDate: carryoverPaymentDate,
  };
}

function validateAdjustmentInput(input: CreditAdjustmentInput, tErrors: ErrorsLabels): void {
  if (!input.studentId?.trim()) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
  if (!Number.isInteger(input.hours) || input.hours < 1 || input.hours > 100_000) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
  if ((input.internalNotes?.trim().length ?? 0) > INTERNAL_NOTES_MAX_LENGTH) {
    throw new ValidationError(tErrors.tooLong);
  }
  if (input.adjustmentType !== CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER) return;

  const carryover = requireCarryoverBlock(input, tErrors);
  if (new Date(carryover.fromDate) > new Date(carryover.toDate)) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
  const maxPaymentDate = new Date();
  maxPaymentDate.setDate(maxPaymentDate.getDate() + 1);
  if (new Date(carryover.paymentDate) > maxPaymentDate) {
    throw new ValidationError(tErrors.credit.invalidInput);
  }
}

/**
 * Resolves a concurrent-insert race on the idempotency key: the competing
 * request won the insert, so its committed row is the canonical result.
 */
async function resolveDuplicateAdjustment(idempotencyKey: string): Promise<CreditAdjustmentReturnType | null> {
  const resolved = await CreditRepository.findByIdempotencyKeys([idempotencyKey]);
  const row = resolved[0];
  return row ? mapToAdjustmentReturnType(row) : null;
}

/**
 * Executes one adjustment atomically: a per-student advisory lock serializes
 * concurrent adjustments, then the idempotency pre-check runs FIRST — ahead
 * of every existence/balance guard — so a replayed submission returns the
 * originally persisted row even when the state that guarded the first write
 * has since changed. The balance guard runs under the lock (no
 * read-modify-write race). Subtractions may carry a carryover block that is
 * mirrored to the payouts table when it exists.
 */
async function executeAdjustmentTransaction(params: AdjustmentTxParams): Promise<AdjustmentTxResult> {
  const { input, tErrors } = params;

  return db.transaction(async tx => {
    await acquireAdvisoryLock(tx, `student_${input.studentId}`);

    const existing = await CreditRepository.findByIdempotencyKeys([params.idempotencyKey], tx);
    const existingRow = existing[0];
    if (existingRow) return { row: mapToAdjustmentReturnType(existingRow), createdNewRow: false };

    await assertActiveStudentExists(input.studentId, tErrors, tx);
    if (params.carryover) {
      await assertTeacherExists(params.carryover.teacherId, tErrors, tx);
    }
    if (params.signedHours < 0) {
      await assertSufficientClasses(tx, input.studentId, input.hours, tErrors);
    }

    const ledgerRow = await CreditRepository.createAdjustment(tx, {
      studentId: input.studentId,
      changeAmount: params.signedHours,
      reason: params.reason,
      adjustmentType: input.adjustmentType,
      notes: sanitizeAdjustmentNotes(input.notes),
      internalNotes: normalizeInternalNotes(input.internalNotes),
      creditedByUserId: params.actorUserId,
      carryoverTeacherId: params.carryover?.teacherId,
      carryoverFromDate: params.carryover?.fromDate,
      carryoverToDate: params.carryover?.toDate,
      carryoverPaymentDate: params.carryover?.paymentDate,
      idempotencyKey: params.idempotencyKey,
    });

    if (params.signedHours < 0) {
      await StudentRepository.deductClasses(input.studentId, tErrors, input.hours, undefined, tx);
    } else {
      await StudentRepository.addClasses(input.studentId, tErrors, input.hours, undefined, tx);
    }
    await QuotaService.refreshStudentOndemandInstances(input.studentId, tx);

    if (params.carryover) {
      await maybeInsertCarryoverBalanceEntry(tx, {
        creditTransactionId: ledgerRow.id,
        teacherId: params.carryover.teacherId,
        studentId: input.studentId,
        fromDate: params.carryover.fromDate,
        toDate: params.carryover.toDate,
        paymentDate: params.carryover.paymentDate,
        hours: input.hours,
        approvedByUserId: params.actorUserId,
      });
    }

    return { row: mapToAdjustmentReturnType(ledgerRow), createdNewRow: true };
  });
}

/**
 * Best-effort audit emit for a committed adjustment — never throws: a failed
 * audit write must not fail an adjustment whose ledger row already committed.
 */
async function emitAdjustmentAudit(params: AdjustmentTxParams, created: CreditAdjustmentReturnType): Promise<void> {
  const { input } = params;
  const audit: CreateAuditLogInput = {
    actorUserId: params.actorUserId,
    actorType: "USER",
    entityType: "STUDENT",
    entityId: input.studentId,
    action: "UPDATE",
    description: `Credit adjustment ${input.adjustmentType}`,
    newState: {
      creditTransactionId: created.id,
      adjustmentType: input.adjustmentType,
      changeAmount: params.signedHours,
      carryoverTeacherId: params.carryover?.teacherId ?? null,
    },
  };

  try {
    await AuditService.createManyAuditLogs([audit]);
  } catch (error) {
    logger.error(
      `credit-service: audit write failed for adjustmentType=${input.adjustmentType} studentId=${input.studentId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { actorUserId: params.actorUserId, studentId: input.studentId, adjustmentType: input.adjustmentType, error }
    );
  }
}

/**
 * Runs an adjustment and resolves same-key concurrent inserts to the winning
 * row. The success log and audit entry are emitted only when the transaction
 * actually persisted a new ledger row — replayed submissions (in-tx or
 * recovered from a unique violation) return the first row without producing
 * duplicate observability records.
 */
async function runAdjustment(params: AdjustmentTxParams, logMessage: string): Promise<CreditAdjustmentReturnType> {
  try {
    // Success is reported only once the transaction commits — a rolled-back
    // adjustment produces neither a success log nor an audit entry.
    const { row, createdNewRow } = await executeAdjustmentTransaction(params);
    if (createdNewRow) {
      logger.info(logMessage, {
        actorUserId: params.actorUserId,
        studentId: params.input.studentId,
        adjustmentType: params.input.adjustmentType,
        changeAmount: params.signedHours,
        carryoverTeacherId: params.carryover?.teacherId,
      });
      await emitAdjustmentAudit(params, row);
    }
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const resolved = await resolveDuplicateAdjustment(params.idempotencyKey);
      if (resolved) return resolved;
    }
    throw error;
  }
}

/**
 * Shared adjustment flow runner: derives the idempotency key from the raw
 * caller input and delegates to {@link runAdjustment}. The per-type flows
 * (Add / Subtract / Subtract-With-Carryover) differ only in signed hours,
 * ledger reason, optional carryover block, and success log message.
 */
/**
 * Per-type adjustment flow configuration. The Add / Subtract /
 * Subtract-With-Carryover flows differ only in signed hours, ledger reason,
 * optional carryover block, and success log message — the shared orchestration
 * (idempotency key derivation, locked transaction, audit) lives in
 * {@link runAdjustment}.
 */
interface AdjustmentFlowConfig {
  requiresCarryover: boolean;
  signedHours: (hours: number) => number;
  reason: CreditReason;
  logMessage: string;
}

const ADJUSTMENT_FLOWS: Partial<Record<CreditAdjustmentType, AdjustmentFlowConfig>> = {
  [CreditAdjustmentType.ADD]: {
    requiresCarryover: false,
    signedHours: hours => hours,
    reason: CreditReason.CREDIT_ADJUSTMENT_ADD,
    logMessage: "Credit adjustment Add recorded",
  },
  [CreditAdjustmentType.SUBTRACT]: {
    requiresCarryover: false,
    signedHours: hours => -hours,
    reason: CreditReason.CREDIT_ADJUSTMENT_SUBTRACT,
    logMessage: "Credit adjustment Subtract recorded",
  },
  [CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER]: {
    requiresCarryover: true,
    signedHours: hours => -hours,
    reason: CreditReason.CREDIT_ADJUSTMENT_CARRYOVER,
    logMessage: "Credit adjustment Subtract-With-Carryover recorded",
  },
};

/** Dispatches a validated adjustment to the matching Add/Subtract flow. */
export async function dispatchAdjustment(
  actorUserId: string,
  input: CreditAdjustmentInput,
  tErrors: ErrorsLabels
): Promise<CreditAdjustmentReturnType> {
  const flow = ADJUSTMENT_FLOWS[input.adjustmentType];
  if (!flow) throw new ValidationError(tErrors.credit.invalidInput);

  const carryover = flow.requiresCarryover ? requireCarryoverBlock(input, tErrors) : undefined;
  return runAdjustment(
    {
      actorUserId,
      input,
      tErrors,
      idempotencyKey: deriveAdjustmentIdempotencyKey(actorUserId, input),
      signedHours: flow.signedHours(input.hours),
      reason: flow.reason,
      carryover,
    },
    flow.logMessage
  );
}

export { validateAdjustmentInput };
