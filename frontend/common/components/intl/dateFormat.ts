import { format } from "date-fns";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

type DateInput = Date | string | number;

export function parseDateInput(date: DateInput | null | undefined): Date | null {
  if (date == null) {
    return null;
  }

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof date === "number") {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const trimmed = date.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDate(date: DateInput): Date {
  const parsed = parseDateInput(date);
  if (!parsed) {
    throw new RangeError("Invalid time value");
  }
  return parsed;
}

/**
 * Dual-tier global cache for Intl.DateTimeFormat instances.
 * Creating new Intl.DateTimeFormat instances is computationally expensive (up to ~100x slower).
 *
 * Tier 1: WeakMap keyed on options object identity (O(1) lookup, zero JSON.stringify overhead
 * and zero string allocation on hot formatting paths for module-level/cached options).
 * Tier 2: String-keyed Map fallback for inline/dynamically instantiated options objects.
 */
const weakDtfCache = new WeakMap<Intl.DateTimeFormatOptions, Map<string, Intl.DateTimeFormat>>();
const stringDtfCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(localeTag: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  // Fast path: O(1) object identity lookup via WeakMap
  let localeMap = weakDtfCache.get(options);
  if (localeMap) {
    const cached = localeMap.get(localeTag);
    if (cached) {
      return cached;
    }
  }

  // Fallback path: JSON serialization key for dynamic options objects
  const stringKey = `${localeTag}:${JSON.stringify(options)}`;
  let dtf = stringDtfCache.get(stringKey);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(localeTag, options);
    stringDtfCache.set(stringKey, dtf);
  }

  // Cache in WeakMap to accelerate future calls with the same options object reference
  if (options && typeof options === "object") {
    if (!localeMap) {
      localeMap = new Map();
      weakDtfCache.set(options, localeMap);
    }
    localeMap.set(localeTag, dtf);
  }

  return dtf;
}

function formatWithFallback(
  date: DateInput,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  fallback = "—"
): string {
  const parsed = parseDateInput(date);
  if (!parsed) {
    if (typeof date === "string" && date.trim().length > 0) {
      return date.trim();
    }
    return fallback;
  }

  return getDateTimeFormatter(getLatnLocaleTag(locale), options).format(parsed);
}

/**
 * Creates a date/time formatter with the given Intl.DateTimeFormatOptions.
 * Eliminates code duplication across formatDate, formatDateTime, formatTime.
 */
function createFormatFunction(
  options: Intl.DateTimeFormatOptions
): (date: DateInput, locale: string, fallback?: string) => string {
  return (date: DateInput, locale: string, fallback = "—"): string =>
    formatWithFallback(date, locale, options, fallback);
}

const ISO_DATE_FORMAT = "yyyy-MM-dd";

/**
 * Formats a `Date` (or null) as an ISO calendar date (`YYYY-MM-DD`) for date
 * input/picker state; returns an empty string when the value is invalid.
 */
export function formatDateInput(date: Date | null): string {
  const parsed = parseDateInput(date);
  return parsed ? format(parsed, ISO_DATE_FORMAT) : "";
}

/**
 * Locale-aware calendar date (e.g. "Jul 18, 2026" / Arabic with Latin numerals).
 */
export const formatDate = createFormatFunction({
  year: "numeric",
  month: "short",
  day: "numeric",
});

/**
 * Locale-aware date and time (e.g. "Jul 18, 2026, 01:20 PM").
 */
export const formatDateTime = createFormatFunction({
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Locale-aware time (e.g. "01:20 PM").
 */
export const formatTime = createFormatFunction({
  hour: "2-digit",
  minute: "2-digit",
});

const MONTH_YEAR_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
};

/**
 * Locale-aware month and year (e.g. "July 2026").
 */
export function formatMonthYear(date: DateInput, locale: string): string {
  return getDateTimeFormatter(getLatnLocaleTag(locale), MONTH_YEAR_OPTIONS).format(toDate(date));
}
