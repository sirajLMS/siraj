import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { RecurringScheduleRepository } from "@/backend/db/repo/scheduling";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { resolveClassRate } from "@/backend/services/pricing/rate-resolver.service";
import {
  MILLISECONDS_PER_MINUTE,
  MINOR_UNITS_PER_UNIT,
} from "@/backend/services/teacher/payroll-calculation.constants";
import type { ClassInstanceSelectType, DBTransaction, PayrollGraceSettings } from "@/backend/types";
import { ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import { parseClassOutcome } from "@/shared/lib/enum";

/**
 * Parses a decimal string into an integer count of minor units (hundredths),
 * rounding half-up when the value carries more than two decimal places.
 * Returns null for values that are not well-formed decimal numbers so callers
 * can distinguish "no amount" from a genuine zero.
 */
export function parseAmountToMinorUnits(raw: string): bigint | null {
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
export function formatMinorUnits(minorUnits: bigint): string {
  const negative = minorUnits < 0n;
  const absolute = negative ? -minorUnits : minorUnits;
  const wholeUnits = absolute / MINOR_UNITS_PER_UNIT;
  const fraction = (absolute % MINOR_UNITS_PER_UNIT).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${wholeUnits}.${fraction}`;
}

/** Integer division that rounds halves up (hour proration and percentage math). */
export function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

/** How the payable duration for one instance was derived. */
export interface PayrollBranchOutcome {
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
export function classifyPayrollBranch(
  instance: ClassInstanceSelectType,
  grace: PayrollGraceSettings
): PayrollBranchOutcome {
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

/** Either a usable hourly rate or the reason rate resolution failed. */
export type PayrollRateResolution =
  | { ok: true; rateMinorUnits: bigint; currency: CurrencyCode }
  | { ok: false; failureReason: string };

/**
 * Resolves the effective hourly rate for the instance through the four-tier
 * precedence cascade (instance override > recurring schedule > subject >
 * teacher). A missing teacher row or a rate that resolves to nothing usable
 * degrades the calculation to NOT_CALCULATED instead of silently paying zero.
 */
export async function resolvePayrollRate(
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
