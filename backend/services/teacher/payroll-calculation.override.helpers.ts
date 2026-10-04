import { CalculationStatus } from "@/backend/enum";
import { logger, ValidationError } from "@/backend/lib";
import { AuditService } from "@/backend/services/system/audit.service";
import {
  divideRoundHalfUp,
  formatMinorUnits,
  parseAmountToMinorUnits,
} from "@/backend/services/teacher/payroll-calculation.branch.helpers";
import {
  MAX_PARTIAL_PERCENTAGE,
  MIN_PARTIAL_PERCENTAGE,
  OPERATOR_SELECTABLE_STATUSES,
  PERCENT_SCALE,
  REFUND_PAID_AMOUNT,
} from "@/backend/services/teacher/payroll-calculation.constants";
import {
  buildFreshCalculationPatch,
  type PayrollSnapshotPatch,
} from "@/backend/services/teacher/payroll-calculation.snapshot.helpers";
import type {
  ClassInstanceSelectType,
  CreateAuditLogInput,
  DBTransaction,
  PayrollOverrideInput,
  PayrollOverrideResult,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** What the post-commit audit-log emit needs to know about one applied override. */
export interface AppliedOverrideAuditContext {
  previousStatus: CalculationStatus;
  newStatus: CalculationStatus;
  amount: string | null;
  partialPercentage: number | null;
  payrollEventId: string;
}

/**
 * One override transaction: the client payload plus the audit context the
 * post-commit emit needs. An idempotent replay writes nothing, so its audit
 * context is null.
 */
export interface OverrideTransactionOutcome {
  result: PayrollOverrideResult;
  auditContext: AppliedOverrideAuditContext | null;
}

/**
 * Best-effort audit-log emit for a committed override — never throws: a failed
 * audit write must not fail an override whose payroll snapshot and
 * PAYROLL_OVERRIDE event already committed. The class_status_events row stays
 * the authoritative payroll trail; this entry mirrors it into the admin audit
 * log so payroll changes surface alongside every other audited entity.
 */
export async function emitOverrideAuditLog(
  input: PayrollOverrideInput,
  context: AppliedOverrideAuditContext
): Promise<void> {
  const audit: CreateAuditLogInput = {
    actorUserId: input.actorUserId,
    actorType: "USER",
    entityType: "CLASS_INSTANCE",
    entityId: input.instanceId,
    action: "UPDATE",
    description: `Payroll override to ${context.newStatus}`,
    previousState: { calculationStatus: context.previousStatus },
    newState: {
      calculationStatus: context.newStatus,
      teacherPaidAmount: context.amount,
      partialPercentage: context.partialPercentage,
      payrollEventId: context.payrollEventId,
    },
  };

  try {
    await AuditService.createManyAuditLogs([audit]);
  } catch (error) {
    logger.error(
      `payroll-service: audit log failed for override on instance ${input.instanceId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { actorUserId: input.actorUserId, instanceId: input.instanceId, error }
    );
  }
}

function hasText(value: string | null | undefined): boolean {
  return value != null && value.trim().length > 0;
}

/** Returns the validated integer percentage, or throws when it is absent or out of range. */
function requirePartialPercentage(input: PayrollOverrideInput, tErrors: ErrorsLabels): number {
  if (input.partialPercentage == null) {
    throw new ValidationError(tErrors.payroll.partialRequiresPercentage);
  }
  if (
    !Number.isInteger(input.partialPercentage) ||
    input.partialPercentage < MIN_PARTIAL_PERCENTAGE ||
    input.partialPercentage > MAX_PARTIAL_PERCENTAGE
  ) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return input.partialPercentage;
}

export function validateOverrideInput(input: PayrollOverrideInput, tErrors: ErrorsLabels): void {
  if (!OPERATOR_SELECTABLE_STATUSES.has(input.targetStatus)) {
    throw new ValidationError(tErrors.payroll.invalidTargetStatus);
  }
  if (input.targetStatus === CalculationStatus.PARTIALLY) {
    requirePartialPercentage(input, tErrors);
    if (!hasText(input.note)) {
      throw new ValidationError(tErrors.invalidInput);
    }
  }
  if (input.targetStatus === CalculationStatus.REFUND && !hasText(input.note)) {
    throw new ValidationError(tErrors.invalidInput);
  }
}

/**
 * Base for percentage proration: the most recent calculated amount on the
 * row, or a fresh calculation when the row carries none. Rows that can no
 * longer produce a base (rate resolution failure) prorate from zero.
 */
async function resolvePartialBaseMinorUnits(
  tx: DBTransaction,
  instance: ClassInstanceSelectType,
  actorUserId: string,
  tErrors: ErrorsLabels
): Promise<bigint> {
  if (instance.teacherPaidAmount != null) {
    const currentMinorUnits = parseAmountToMinorUnits(instance.teacherPaidAmount);
    if (currentMinorUnits != null) {
      return currentMinorUnits;
    }
  }
  const { patch } = await buildFreshCalculationPatch(tx, instance, actorUserId, tErrors);
  if (patch.teacherPaidAmount == null) {
    return 0n;
  }
  return parseAmountToMinorUnits(patch.teacherPaidAmount) ?? 0n;
}

export async function buildOverridePatch(
  tx: DBTransaction,
  instance: ClassInstanceSelectType,
  input: PayrollOverrideInput,
  sanitizedNote: string | null,
  tErrors: ErrorsLabels
): Promise<PayrollSnapshotPatch> {
  const base = {
    payrollNote: sanitizedNote,
    payrollCalculatedAt: new Date(),
    payrollCalculatedBy: input.actorUserId,
  };

  switch (input.targetStatus) {
    case CalculationStatus.REFUND:
      // Duration and currency are preserved for audit; the amount is zeroed.
      return {
        ...base,
        calculationStatus: CalculationStatus.REFUND,
        teacherPaidAmount: REFUND_PAID_AMOUNT,
        isPartialPercentage: null,
      };

    case CalculationStatus.NOT_CALCULATED:
      return {
        ...base,
        calculationStatus: CalculationStatus.NOT_CALCULATED,
        teacherPaidAmount: null,
        calculatedDuration: null,
        isPartialPercentage: null,
      };

    case CalculationStatus.CALCULATED: {
      // Re-run the calculator. The operator note is kept when the fresh
      // snapshot succeeds; a rate failure keeps its diagnostic note instead.
      const { patch } = await buildFreshCalculationPatch(tx, instance, input.actorUserId, tErrors);
      return patch.calculationStatus === CalculationStatus.CALCULATED ? { ...patch, ...base } : patch;
    }

    case CalculationStatus.PARTIALLY: {
      const percentage = requirePartialPercentage(input, tErrors);
      const baseMinorUnits = await resolvePartialBaseMinorUnits(tx, instance, input.actorUserId, tErrors);
      const partialMinorUnits = divideRoundHalfUp(baseMinorUnits * BigInt(percentage), PERCENT_SCALE);
      return {
        ...base,
        calculationStatus: CalculationStatus.PARTIALLY,
        teacherPaidAmount: formatMinorUnits(partialMinorUnits),
        isPartialPercentage: percentage,
      };
    }

    default:
      throw new ValidationError(tErrors.payroll.invalidTargetStatus);
  }
}
