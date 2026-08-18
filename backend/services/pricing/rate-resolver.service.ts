import { RateSource } from "@/backend/enum";
import type { ResolveClassRateInput, ResolvedClassRate } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/** Default currency when no tier defines one. */
const DEFAULT_CURRENCY: CurrencyCode = CurrencyCode.SAR;

/**
 * Resolve the effective hourly rate for a class instance using the 4-tier
 * precedence cascade:
 *
 *   1. {@link RateSource.OVERRIDE}  — `class_instances.rate_amount` when
 *      `is_rate_overridden = true` (admin manual override).
 *   2. {@link RateSource.RECURRING} — `recurring_schedules.hourly_rate`.
 *   3. {@link RateSource.SUBJECT}   — `class_subjects.hourly_rate`.
 *   4. {@link RateSource.TEACHER}   — `teachers.hourly_rate` (fallback).
 *
 * A tier "applies" only when its `hourlyRate` is a non-null, non-empty string
 * that parses to a finite number. Currency is inherited from the next tier
 * down that defines one (default `SAR`).
 *
 * This is a PURE function — no DB access, no side effects. The single source
 * of truth for the cascade; both `TeacherDueService.createDueEntry` and the
 * recurring-class/ad-hoc booking snapshot paths call it.
 */
export function resolveClassRate(input: ResolveClassRateInput): ResolvedClassRate {
  const { classInstance, recurringSchedule, subject, teacher } = input;

  // Tier 1: admin manual override on the class instance itself.
  if (classInstance.isRateOverridden && hasAmount(classInstance.rateAmount)) {
    return {
      hourlyRate: classInstance.rateAmount,
      currency: resolveCurrency(classInstance.rateCurrency, [recurringSchedule, subject, teacher]),
      source: RateSource.OVERRIDE,
    };
  }

  // Tier 2: recurring-class rate (specific student+teacher+subject combination).
  if (hasAmount(recurringSchedule?.hourlyRate)) {
    return {
      hourlyRate: recurringSchedule.hourlyRate,
      currency: resolveCurrency(recurringSchedule.rateCurrency, [subject, teacher]),
      source: RateSource.RECURRING,
    };
  }

  // Tier 3: subject rate (global per subject, any teacher).
  if (hasAmount(subject?.hourlyRate)) {
    return {
      hourlyRate: subject.hourlyRate,
      currency: resolveCurrency(subject.rateCurrency, [teacher]),
      source: RateSource.SUBJECT,
    };
  }

  // Tier 4: teacher rate (fallback).
  return {
    hourlyRate: hasAmount(teacher.hourlyRate) ? teacher.hourlyRate : "0",
    currency: resolveCurrency(teacher.rateCurrency, []),
    source: RateSource.TEACHER,
  };
}

/** True when `value` is a non-empty string that parses to a finite number > 0. */
function hasAmount(value: string | null | undefined): value is string {
  if (value == null || value === "") return false;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0;
}

/**
 * Walk down `tiers` (in order) and return the first non-null currency, falling
 * back to {@link DEFAULT_CURRENCY}. Used to inherit currency from a lower tier
 * when the chosen rate tier omits it.
 */
function resolveCurrency(
  primary: CurrencyCode | null | undefined,
  tiers: ReadonlyArray<{ readonly rateCurrency?: CurrencyCode | null } | null | undefined>
): CurrencyCode {
  if (primary) return primary;
  for (const tier of tiers) {
    if (tier?.rateCurrency) return tier.rateCurrency;
  }
  return DEFAULT_CURRENCY;
}
