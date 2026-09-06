import { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Minimal session shape consumed by the carryover aggregation helpers.
 * Structural — Drizzle `ClassInstanceSelectType` rows satisfy it without
 * mapping, and the fields are optional so partially-selected instances
 * (e.g. from narrowed selects) still type-check.
 */
export interface CarryoverAggregateInstance {
  teacherId: string;
  teacherPaidCurrency?: CurrencyCode | null;
  calculatedDuration?: number | null;
  scheduledStartAt?: Date | string | null;
}

const ISO_DATE_LENGTH = 10;
const HALF_UNIT = 0.5;
const HALF_EPSILON = 1e-9;

/**
 * Fallback currency for report aggregates when there are no rows to derive
 * a dominant currency from. Mirrors the accounting session-audit precedent.
 */
const FALLBACK_REPORT_CURRENCY = CurrencyCode.SAR;

type DateLikeInput = Date | string | null | undefined;

function toIsoDate(value: DateLikeInput): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, ISO_DATE_LENGTH);
  return value.slice(0, ISO_DATE_LENGTH);
}

function pickIsoExtreme(
  dates: readonly DateLikeInput[],
  isBetter: (candidate: string, current: string) => boolean
): string | null {
  let result: string | null = null;
  for (const raw of dates) {
    const candidate = toIsoDate(raw);
    if (candidate == null) continue;
    if (result == null || isBetter(candidate, result)) result = candidate;
  }
  return result;
}

/**
 * Round-half-even (banker's rounding) to the given decimal places. The
 * epsilon absorbs binary floating-point noise so that exact decimal halves
 * still trigger the half-even branch.
 */
function roundHalfEven(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  const scaled = value * factor;
  const lower = Math.floor(scaled);
  const fraction = scaled - lower;
  let units: number;
  if (fraction > HALF_UNIT + HALF_EPSILON) {
    units = lower + 1;
  } else if (fraction < HALF_UNIT - HALF_EPSILON) {
    units = lower;
  } else {
    units = lower % 2 === 0 ? lower : lower + 1;
  }
  return units / factor;
}

/**
 * Buckets class instances by teacher, preserving insertion order of first
 * appearance for both the map keys and each bucket's contents.
 */
export function groupInstancesByTeacher<T extends { teacherId: string }>(instances: readonly T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const instance of instances) {
    const bucket = groups.get(instance.teacherId);
    if (bucket) {
      bucket.push(instance);
    } else {
      groups.set(instance.teacherId, [instance]);
    }
  }
  return groups;
}

/**
 * Currency carried by the most sessions in the group. Instances without a
 * recorded paid currency do not vote; when the leading count is shared by
 * more than one currency (or no instance carries any currency) the fallback
 * — the teacher's rate currency — wins, keeping derived totals aligned with
 * what the teacher is normally paid in.
 */
export function resolveDominantCurrency(
  instances: readonly CarryoverAggregateInstance[],
  fallback: CurrencyCode
): CurrencyCode {
  const counts = new Map<CurrencyCode, number>();
  for (const instance of instances) {
    if (instance.teacherPaidCurrency == null) continue;
    counts.set(instance.teacherPaidCurrency, (counts.get(instance.teacherPaidCurrency) ?? 0) + 1);
  }
  let leading: CurrencyCode | null = null;
  let leadingCount = 0;
  let tied = false;
  for (const [currency, count] of counts) {
    if (count > leadingCount) {
      leading = currency;
      leadingCount = count;
      tied = false;
    } else if (count === leadingCount) {
      tied = true;
    }
  }
  if (tied || leading == null) return fallback;
  return leading;
}

/**
 * Total billable hours across the sessions: `calculatedDuration` is stored
 * in minutes, so the sum is divided by 60 and half-even rounded to two
 * decimals. Sessions without a calculated duration contribute zero.
 */
export function computeTotalDurationHours(instances: readonly CarryoverAggregateInstance[]): string {
  const totalMinutes = instances.reduce((sum, instance) => sum + (instance.calculatedDuration ?? 0), 0);
  const hours = roundHalfEven(totalMinutes / 60, 2);
  return hours.toFixed(2);
}

/**
 * Human-readable student list for the carryover row. The persisted column
 * is bounded, so overlong text is cut at `maxLen - 3` and an ellipsis is
 * appended, keeping the stored length at or below `maxLen`.
 */
export function truncateWithEllipsis(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 3)}…`;
}

/**
 * Earliest scheduled date across the sessions as an ISO calendar date
 * (`YYYY-MM-DD`), or `null` when no usable value is present. The persisted
 * `fromDate` column is a plain date, not a timestamp.
 */
export function minDate(dates: readonly DateLikeInput[]): string | null {
  return pickIsoExtreme(dates, (candidate, current) => candidate < current);
}

/**
 * Latest scheduled date across the sessions as an ISO calendar date
 * (`YYYY-MM-DD`), or `null` when no usable value is present.
 */
export function maxDate(dates: readonly DateLikeInput[]): string | null {
  return pickIsoExtreme(dates, (candidate, current) => candidate > current);
}

/**
 * Currency carried by the most carryover rows in a report page. Ties are
 * resolved deterministically to the currency that first reached the leading
 * count; an empty page falls back to a fixed default so the aggregate
 * summary always has a currency label.
 */
export function pickDominantCurrency(rows: readonly { teacherCurrency: CurrencyCode }[]): CurrencyCode {
  const counts = new Map<CurrencyCode, number>();
  for (const row of rows) {
    counts.set(row.teacherCurrency, (counts.get(row.teacherCurrency) ?? 0) + 1);
  }
  let dominant: CurrencyCode | null = null;
  let leadingCount = 0;
  for (const [currency, count] of counts) {
    if (count > leadingCount) {
      dominant = currency;
      leadingCount = count;
    }
  }
  return dominant ?? FALLBACK_REPORT_CURRENCY;
}
