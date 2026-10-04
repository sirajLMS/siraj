import { createHash } from "node:crypto";
import { ClassStatusEventsRepository } from "@/backend/db/repo/scheduling";
import type { PayrollCalculationPatch } from "@/backend/db/repo/scheduling/class-instances";
import { CalculationStatus } from "@/backend/enum";
import { DomainError } from "@/backend/lib";
import {
  classifyPayrollBranch,
  divideRoundHalfUp,
  formatMinorUnits,
  type PayrollBranchOutcome,
  resolvePayrollRate,
} from "@/backend/services/teacher/payroll-calculation.branch.helpers";
import {
  AUTO_CALC_FAILURE_PREFIX,
  DEFAULT_REPORT_CURRENCY,
  MINUTES_PER_HOUR,
  TERMINAL_EXECUTION_STATES,
  ZERO_PAID_AMOUNT,
} from "@/backend/services/teacher/payroll-calculation.constants";
import { resolveGraceSettings } from "@/backend/services/teacher/payroll-grace-settings";
import type {
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  DBTransaction,
  PayrollCalculationResult,
  PayrollOverrideResult,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseClassExecutionState } from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/locale";

/** A payroll snapshot patch whose target status is always decided. */
export type PayrollSnapshotPatch = PayrollCalculationPatch & { calculationStatus: CalculationStatus };

function buildCalculatedPatch(
  branch: PayrollBranchOutcome,
  rate: { rateMinorUnits: bigint; currency: CurrencyCode },
  actorUserId: string
): PayrollSnapshotPatch {
  const paidMinorUnits = divideRoundHalfUp(rate.rateMinorUnits * BigInt(branch.calculatedDuration), MINUTES_PER_HOUR);
  return {
    calculationStatus: CalculationStatus.CALCULATED,
    calculatedDuration: branch.calculatedDuration,
    teacherPaidAmount: formatMinorUnits(paidMinorUnits),
    teacherPaidCurrency: rate.currency,
    isPartialPercentage: null,
    payrollNote: null,
    payrollCalculatedAt: new Date(),
    payrollCalculatedBy: actorUserId,
  };
}

function buildRateFailurePatch(actorUserId: string, failureReason: string): PayrollSnapshotPatch {
  return {
    calculationStatus: CalculationStatus.NOT_CALCULATED,
    calculatedDuration: null,
    teacherPaidAmount: null,
    teacherPaidCurrency: null,
    isPartialPercentage: null,
    payrollNote: `${AUTO_CALC_FAILURE_PREFIX} ${failureReason}`,
    payrollCalculatedAt: new Date(),
    payrollCalculatedBy: actorUserId,
  };
}

/**
 * Computes a fresh payroll snapshot for the instance without writing it.
 * Non-terminal sessions are rejected; an unusable rate degrades the snapshot
 * to NOT_CALCULATED with the failure reason persisted as the payroll note.
 */
export async function buildFreshCalculationPatch(
  tx: DBTransaction,
  instance: ClassInstanceSelectType,
  actorUserId: string,
  tErrors: ErrorsLabels
): Promise<{ patch: PayrollSnapshotPatch; branch: PayrollBranchOutcome }> {
  if (!TERMINAL_EXECUTION_STATES.has(parseClassExecutionState(instance.executionState))) {
    throw new DomainError("PAYROLL_NOT_TERMINAL", tErrors.payroll.notTerminal);
  }

  const grace = await resolveGraceSettings(tx);
  const branch = classifyPayrollBranch(instance, grace);
  const rate = await resolvePayrollRate(tx, instance);
  if (rate.ok) {
    return { patch: buildCalculatedPatch(branch, rate, actorUserId), branch };
  }
  return { patch: buildRateFailurePatch(actorUserId, rate.failureReason), branch };
}

/**
 * Content-derived key for a calculation snapshot: re-running the identical
 * calculation within the idempotency window collapses onto the first result
 * instead of duplicating the snapshot write and audit event.
 */
export function deriveCalculationIdempotencyKey(
  instanceId: string,
  calculationStatus: CalculationStatus,
  calculatedDuration: number | null | undefined,
  teacherPaidAmount: string | null | undefined
): string {
  const parts = [instanceId, calculationStatus, String(calculatedDuration ?? ""), teacherPaidAmount ?? ""];
  return createHash("sha256")
    .update(`payroll-calculation:${parts.join(":")}`)
    .digest("hex");
}

export function buildPayrollEventRow(input: {
  classInstanceId: string;
  eventType: string;
  previous: ClassInstanceSelectType;
  patch: PayrollSnapshotPatch;
  description: string | null;
  actorUserId: string;
  idempotencyKey: string;
}): ClassStatusEventSeedInsertInput {
  return {
    classInstanceId: input.classInstanceId,
    eventType: input.eventType,
    fromState: {
      calculationStatus: input.previous.calculationStatus,
      teacherPaidAmount: input.previous.teacherPaidAmount ?? null,
    },
    toState: {
      calculationStatus: input.patch.calculationStatus,
      teacherPaidAmount: input.patch.teacherPaidAmount ?? null,
      partialPercentage: input.patch.isPartialPercentage ?? null,
      idempotencyKey: input.idempotencyKey,
    },
    description: input.description,
    actorUserId: input.actorUserId,
    createdAt: new Date(),
  };
}

export async function insertPayrollEvent(
  tx: DBTransaction,
  row: ClassStatusEventSeedInsertInput,
  tErrors: ErrorsLabels
): Promise<string> {
  const [event] = await ClassStatusEventsRepository.createMany([row], tx);
  if (!event) {
    throw new DomainError("PAYROLL_EVENT_INSERT_FAILED", tErrors.internalServerError);
  }
  return event.id;
}

export function mapToCalculationResult(
  instance: ClassInstanceSelectType,
  branch: PayrollBranchOutcome
): PayrollCalculationResult {
  return {
    instanceId: instance.id,
    calculatedDuration: instance.calculatedDuration ?? branch.calculatedDuration,
    teacherPaidAmount: instance.teacherPaidAmount ?? ZERO_PAID_AMOUNT,
    teacherPaidCurrency: instance.teacherPaidCurrency ?? DEFAULT_REPORT_CURRENCY,
    calculationStatus: instance.calculationStatus,
    isStudentAbsence: branch.isStudentAbsence,
    isTeacherAbsence: branch.isTeacherAbsence,
    isWithinGrace: branch.isWithinGrace,
    isProRated: branch.isProRated,
  };
}

export function mapToOverrideResult(instance: ClassInstanceSelectType, auditEventId: string): PayrollOverrideResult {
  return {
    instanceId: instance.id,
    calculationStatus: instance.calculationStatus,
    teacherPaidAmount: instance.teacherPaidAmount,
    teacherPaidCurrency: instance.teacherPaidCurrency,
    calculatedDuration: instance.calculatedDuration,
    isPartialPercentage: instance.isPartialPercentage,
    payrollNote: instance.payrollNote,
    auditEventId,
  };
}
