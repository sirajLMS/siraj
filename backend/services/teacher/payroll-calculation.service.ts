import { createHash } from "node:crypto";
import { db } from "@/backend/db/drizzleDb";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import {
  ClassStatusEventsRepository,
  RecurringScheduleRepository,
  SchedulingRepository,
} from "@/backend/db/repo/scheduling";
import type { PayrollCalculationPatch } from "@/backend/db/repo/scheduling/class-instances";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission, CalculationStatus } from "@/backend/enum";
import { DomainError, logger, NotFoundError, sanitizePlainText, ValidationError } from "@/backend/lib";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import { resolveClassRate } from "@/backend/services/pricing/rate-resolver.service";
import { AuditService } from "@/backend/services/system/audit.service";
import { type PayrollGraceSettings, resolveGraceSettings } from "@/backend/services/teacher/payroll-grace-settings";
import { deriveOverrideIdempotencyKey } from "@/backend/services/teacher/payroll-override.idempotency";
import type {
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  CreateAuditLogInput,
  DBTransaction,
  PayrollCalculationInput,
  PayrollCalculationResult,
  PayrollOverrideInput,
  PayrollOverrideResult,
  PayrollReportFilters,
  PayrollReportPage,
  PayrollReportRow,
} from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseClassExecutionState, parseClassOutcome } from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/locale";

const MINUTES_PER_HOUR = 60n;
const PERCENT_SCALE = 100n;
const MINOR_UNITS_PER_UNIT = 100n;
const MILLISECONDS_PER_MINUTE = 60_000;

/**
 * `class_status_events.eventType` is a plain varchar column with no TypeScript
 * enum counterpart — the two payroll event kinds are module constants.
 */
const PAYROLL_STATUS_TRANSITION_EVENT_TYPE = "PAYROLL_STATUS_TRANSITION";
const PAYROLL_OVERRIDE_EVENT_TYPE = "PAYROLL_OVERRIDE";

/** Duplicate submissions inside this window collapse onto the first persisted event. */
const IDEMPOTENCY_WINDOW_SECONDS = 30;

/**
 * Refund rows must carry exactly this literal: the database CHECK constraint
 * compares text equality, so any other zero representation is rejected.
 */
const REFUND_PAID_AMOUNT = "0";

/** Report aggregates scan the filtered set, bounded to the same ceiling as CSV export. */
const REPORT_AGGREGATE_ROW_CAP = 10_000;

const MIN_PARTIAL_PERCENTAGE = 0;
const MAX_PARTIAL_PERCENTAGE = 100;

/** Statuses an operator may pick in the override dialog; settlement states are system-owned. */
const OPERATOR_SELECTABLE_STATUSES = new Set<CalculationStatus>([
  CalculationStatus.REFUND,
  CalculationStatus.NOT_CALCULATED,
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
]);

/**
 * Operator-controlled settlement statuses. Automatic recalculation never
 * overwrites them — an explicit forceRecalc is required.
 */
const STICKY_STATUSES = new Set<CalculationStatus>([
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
  CalculationStatus.WAITING_PAID,
]);

/** Execution states for which a payroll snapshot is meaningful. */
const TERMINAL_EXECUTION_STATES = new Set<ClassExecutionState>([
  ClassExecutionState.COMPLETED,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
  ClassExecutionState.ON_DEMAND_CONFLICT_HELD,
  ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
]);

const AUTO_CALC_FAILURE_PREFIX = "Auto-calc failed:";
const ZERO_PAID_AMOUNT = "0.00";
const DEFAULT_REPORT_CURRENCY = CurrencyCode.SAR;

// ---------------------------------------------------------------------------
// Precision-safe decimal-string arithmetic
// ---------------------------------------------------------------------------

/**
 * Parses a decimal string into an integer count of minor units (hundredths),
 * rounding half-up when the value carries more than two decimal places.
 * Returns null for values that are not well-formed decimal numbers so callers
 * can distinguish "no amount" from a genuine zero.
 */
function parseAmountToMinorUnits(raw: string): bigint | null {
  const trimmed = raw.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) return null;

  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [integerPart, fractionPart = ""] = unsigned.split(".");
  const scaledFraction = fractionPart.padEnd(2, "0");
  let minorUnits = BigInt(integerPart + scaledFraction.slice(0, 2));
  const droppedDigits = scaledFraction.slice(2);
  if (droppedDigits.length > 0 && Number(droppedDigits[0]) >= 5) {
    minorUnits += 1n;
  }
  return negative ? -minorUnits : minorUnits;
}

/** Renders minor units back into the canonical two-decimal amount string. */
function formatMinorUnits(minorUnits: bigint): string {
  const negative = minorUnits < 0n;
  const absolute = negative ? -minorUnits : minorUnits;
  const wholeUnits = absolute / MINOR_UNITS_PER_UNIT;
  const fraction = (absolute % MINOR_UNITS_PER_UNIT).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${wholeUnits}.${fraction}`;
}

/** Integer division that rounds halves up (hour proration and percentage math). */
function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

// ---------------------------------------------------------------------------
// Payable-duration classification
// ---------------------------------------------------------------------------

/** How the payable duration for one instance was derived. */
interface PayrollBranchOutcome {
  calculatedDuration: number;
  isStudentAbsence: boolean;
  isTeacherAbsence: boolean;
  isWithinGrace: boolean;
  isProRated: boolean;
}

/** Whole elapsed minutes, rounded down — payable time never exceeds the exact span. */
function floorMinutesBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / MILLISECONDS_PER_MINUTE);
}

/**
 * Applies the payable-duration rules to one instance:
 *
 * 1. Student absence — teacher joined, student did not: the full scheduled
 *    window is payable.
 * 2. Teacher absence — no attendance telemetry ever arrived
 *    (`actualStartAt` is null), whatever the outcome says: zero pay (still a
 *    successful calculation). An absent outcome without a join timestamp
 *    means the teacher never taught, so the student-absence rule does not
 *    rescue the row.
 * 3. On-time — entry within the grace window (short grace for sessions at or
 *    below the threshold duration, long grace above it): full scheduled pay.
 * 4. Pro-rated — entry beyond grace: payable time runs from the actual join
 *    time to the scheduled end; overtime is never credited.
 */
function classifyPayrollBranch(instance: ClassInstanceSelectType, grace: PayrollGraceSettings): PayrollBranchOutcome {
  const scheduledDurationMinutes = floorMinutesBetween(instance.scheduledStartAt, instance.scheduledEndAt);
  const outcome = parseClassOutcome(instance.outcome);

  if (outcome === ClassOutcome.ABSENT && instance.actualStartAt != null) {
    return {
      calculatedDuration: scheduledDurationMinutes,
      isStudentAbsence: true,
      isTeacherAbsence: false,
      isWithinGrace: false,
      isProRated: false,
    };
  }

  // Order matters: any row that reaches here with no join telemetry pays
  // zero as a teacher absence — including rows whose outcome says ABSENT,
  // because a student absence the teacher also missed was never taught.
  // (Rows where the teacher DID join an absent-marked session already
  // returned as student absence above.)
  if (instance.actualStartAt == null) {
    return {
      calculatedDuration: 0,
      isStudentAbsence: false,
      isTeacherAbsence: true,
      isWithinGrace: false,
      isProRated: false,
    };
  }

  // The teacher-absence early return guarantees a join timestamp here.
  const effectiveStart = instance.actualStartAt;
  const latenessMinutes = floorMinutesBetween(instance.scheduledStartAt, effectiveStart);
  const graceThresholdMinutes =
    scheduledDurationMinutes <= grace.thresholdMinutes ? grace.shortMinutes : grace.longMinutes;

  if (latenessMinutes <= graceThresholdMinutes) {
    return {
      calculatedDuration: scheduledDurationMinutes,
      isStudentAbsence: false,
      isTeacherAbsence: false,
      isWithinGrace: true,
      isProRated: false,
    };
  }

  const payableEnd =
    instance.actualEndAt != null && instance.actualEndAt.getTime() < instance.scheduledEndAt.getTime()
      ? instance.actualEndAt
      : instance.scheduledEndAt;
  return {
    calculatedDuration: Math.max(0, floorMinutesBetween(effectiveStart, payableEnd)),
    isStudentAbsence: false,
    isTeacherAbsence: false,
    isWithinGrace: false,
    isProRated: true,
  };
}

// ---------------------------------------------------------------------------
// Rate resolution
// ---------------------------------------------------------------------------

/** Either a usable hourly rate or the reason rate resolution failed. */
type PayrollRateResolution =
  | { ok: true; rateMinorUnits: bigint; currency: CurrencyCode }
  | { ok: false; failureReason: string };

/**
 * Resolves the effective hourly rate for the instance through the four-tier
 * precedence cascade (instance override > recurring schedule > subject >
 * teacher). A missing teacher row or a rate that resolves to nothing usable
 * degrades the calculation to NOT_CALCULATED instead of silently paying zero.
 */
async function resolvePayrollRate(
  tx: DBTransaction,
  instance: ClassInstanceSelectType
): Promise<PayrollRateResolution> {
  const [recurringScheduleRow, subject, teacher] = await Promise.all([
    instance.recurringScheduleId
      ? RecurringScheduleRepository.findById(instance.recurringScheduleId, tx)
      : Promise.resolve(null),
    // A soft-deleted subject simply drops out of the rate cascade.
    ClassSubjectRepository.getSubjectById(instance.subjectId, undefined, tx).catch(() => null),
    TeacherRepository.findById(instance.teacherId, tx),
  ]);
  if (!teacher) {
    return { ok: false, failureReason: "teacher record not found" };
  }

  const resolved = resolveClassRate({
    classInstance: instance,
    recurringSchedule: recurringScheduleRow?.schedule ?? null,
    subject,
    teacher,
  });
  const rateMinorUnits = parseAmountToMinorUnits(resolved.hourlyRate);
  if (rateMinorUnits == null || rateMinorUnits <= 0n) {
    return { ok: false, failureReason: "rate resolution returned no usable rate" };
  }
  return { ok: true, rateMinorUnits, currency: resolved.currency };
}

// ---------------------------------------------------------------------------
// Snapshot patches
// ---------------------------------------------------------------------------

/** A payroll snapshot patch whose target status is always decided. */
type PayrollSnapshotPatch = PayrollCalculationPatch & { calculationStatus: CalculationStatus };

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
async function buildFreshCalculationPatch(
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

// ---------------------------------------------------------------------------
// Idempotency + audit events
// ---------------------------------------------------------------------------

/**
 * Content-derived key for a calculation snapshot: re-running the identical
 * calculation within the idempotency window collapses onto the first result
 * instead of duplicating the snapshot write and audit event.
 */
function deriveCalculationIdempotencyKey(
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

function buildPayrollEventRow(input: {
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

async function insertPayrollEvent(
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

// ---------------------------------------------------------------------------
// Result mapping
// ---------------------------------------------------------------------------

function mapToCalculationResult(
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

function mapToOverrideResult(instance: ClassInstanceSelectType, auditEventId: string): PayrollOverrideResult {
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

// ---------------------------------------------------------------------------
// Override audit-log emit
// ---------------------------------------------------------------------------

/** What the post-commit audit-log emit needs to know about one applied override. */
interface AppliedOverrideAuditContext {
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
interface OverrideTransactionOutcome {
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
async function emitOverrideAuditLog(input: PayrollOverrideInput, context: AppliedOverrideAuditContext): Promise<void> {
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

// ---------------------------------------------------------------------------
// Override validation
// ---------------------------------------------------------------------------

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

function validateOverrideInput(input: PayrollOverrideInput, tErrors: ErrorsLabels): void {
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

// ---------------------------------------------------------------------------
// Override patch (the four operator modes)
// ---------------------------------------------------------------------------

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

async function buildOverridePatch(
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

// ---------------------------------------------------------------------------
// Report aggregation
// ---------------------------------------------------------------------------

function buildRowCountByStatus(rows: readonly PayrollReportRow[]): Record<CalculationStatus, number> {
  const counts: Record<CalculationStatus, number> = {
    [CalculationStatus.NOT_CALCULATED]: 0,
    [CalculationStatus.CALCULATED]: 0,
    [CalculationStatus.PARTIALLY]: 0,
    [CalculationStatus.REFUND]: 0,
    [CalculationStatus.WAITING_PAID]: 0,
    [CalculationStatus.PAID]: 0,
  };
  for (const row of rows) {
    counts[row.calculationStatus] += 1;
  }
  return counts;
}

/** Sums paid amounts as exact minor-unit integers — no floating point anywhere. */
function sumPaidAmounts(rows: readonly PayrollReportRow[]): string {
  let totalMinorUnits = 0n;
  for (const row of rows) {
    if (row.teacherPaidAmount == null) continue;
    const minorUnits = parseAmountToMinorUnits(row.teacherPaidAmount);
    if (minorUnits != null) {
      totalMinorUnits += minorUnits;
    }
  }
  return formatMinorUnits(totalMinorUnits);
}

/** Most frequent currency across rows; ties keep the earliest-seen currency. */
function pickDominantCurrency(rows: readonly PayrollReportRow[]): CurrencyCode {
  let dominant = DEFAULT_REPORT_CURRENCY;
  let dominantCount = 0;
  const counts = new Map<CurrencyCode, number>();
  for (const row of rows) {
    if (row.teacherPaidCurrency == null) continue;
    const count = (counts.get(row.teacherPaidCurrency) ?? 0) + 1;
    counts.set(row.teacherPaidCurrency, count);
    if (count > dominantCount) {
      dominant = row.teacherPaidCurrency;
      dominantCount = count;
    }
  }
  return dominant;
}

// ---------------------------------------------------------------------------
// Transaction orchestration
// ---------------------------------------------------------------------------

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

async function calculateWithinTransaction(
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

async function applyOverrideWithinTransaction(
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

// ---------------------------------------------------------------------------
// Public service surface
// ---------------------------------------------------------------------------

export namespace PayrollCalculationService {
  /**
   * Calculates (or re-calculates) the payroll snapshot for one class instance:
   * payable duration per the absence / grace / pro-rating rules, amount from
   * the resolved hourly rate, and an audit event for the status transition.
   *
   * Rows in an operator settlement state (PARTIALLY / REFUND / WAITING_PAID)
   * are returned untouched unless `forceRecalc` is set; PAID rows always
   * reject. Rate-resolution failures persist a NOT_CALCULATED snapshot with
   * the failure reason as the payroll note instead of throwing, so the
   * surrounding state transition never rolls back. Identical re-runs within
   * the idempotency window return the first result without duplicate writes.
   *
   * Pass the caller's transaction to embed the calculation in a wider write
   * (the scheduling state machine does this on terminal transitions). The
   * embedded run relies on the caller row lock and skips the teacher
   * advisory lock (see lockInstanceForPayroll for the lock-ordering rule).
   */
  export async function calculateForInstance(
    input: PayrollCalculationInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<PayrollCalculationResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);
    // A caller-provided tx means the caller already holds the instance row
    // lock; taking the advisory there would invert the standalone
    // advisory-then-row order, so only standalone runs lock both.
    const calculate = (executor: DBTransaction) =>
      calculateWithinTransaction(executor, input, tErrors, { advisoryLock: tx == null });
    return tx ? calculate(tx) : db.transaction(calculate);
  }

  /**
   * Applies an operator override to one instance's payroll snapshot (Refund /
   * Calculated / Not Calculated / Partially) and appends a PAYROLL_OVERRIDE
   * audit event. PAID rows reject; WAITING_PAID rows reject unless `force` is
   * set. The identical override re-submitted within the idempotency window
   * returns the first-applied result without a duplicate event. After the
   * transaction commits, a fresh override is mirrored into the admin audit
   * log (best-effort — see emitOverrideAuditLog).
   */
  export async function applyOverride(
    input: PayrollOverrideInput,
    tErrors: ErrorsLabels
  ): Promise<PayrollOverrideResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);
    validateOverrideInput(input, tErrors);
    const idempotencyKey = deriveOverrideIdempotencyKey(input);
    const { result, auditContext } = await db.transaction(tx =>
      applyOverrideWithinTransaction(tx, input, idempotencyKey, tErrors)
    );
    if (auditContext) {
      await emitOverrideAuditLog(input, auditContext);
    }
    return result;
  }

  /**
   * Reads one page of the payroll report plus aggregates over the full
   * filtered set: the exact decimal sum of paid amounts, the dominant
   * currency, and row counts per calculation status (every status key
   * present). The aggregate scan is bounded by the export ceiling.
   */
  export async function getReport(
    actorUserId: string,
    filters: PayrollReportFilters,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<PayrollReportPage> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors);

    const page = await SchedulingRepository.findPayrollReportRows(filters, pagination);

    // Aggregates describe the filtered set, not just the requested page; when
    // the whole set already sits on this page no second scan is needed.
    const aggregateRows =
      pagination.offset === 0 && page.totalCount <= pagination.limit
        ? page.rows
        : (
            await SchedulingRepository.findPayrollReportRows(filters, {
              limit: REPORT_AGGREGATE_ROW_CAP,
              offset: 0,
            })
          ).rows;

    return {
      rows: page.rows,
      totalCount: page.totalCount,
      aggregates: {
        totalPaidAmount: sumPaidAmounts(aggregateRows),
        totalPaidCurrency: pickDominantCurrency(aggregateRows),
        rowCountByStatus: buildRowCountByStatus(aggregateRows),
      },
    };
  }
}
