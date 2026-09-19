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
 * Global caches for Intl.DateTimeFormat instances.
 * Creating new Intl.DateTimeFormat instances is computationally expensive (up to ~100x slower).
 *
 * `dtfWeakCache` uses options object identity as the primary key. For static option objects
 * (e.g., `formatDate`, `formatDateTime`, `formatTime`, `MONTH_YEAR_OPTIONS`), this bypasses
 * string concatenation and `JSON.stringify` serialization on every formatting call (~30x faster lookup).
 *
 * `dtfStringCache` serves as a fallback for dynamic inline options objects.
 */
const dtfWeakCache = new WeakMap<object, Map<string, Intl.DateTimeFormat>>();
const dtfStringCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(localeTag: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  let localeMap = dtfWeakCache.get(options);
  if (localeMap) {
    const cached = localeMap.get(localeTag);
    if (cached) {
      return cached;
    }
  } else {
    localeMap = new Map<string, Intl.DateTimeFormat>();
    dtfWeakCache.set(options, localeMap);
  }

  const cacheKey = `${localeTag}:${JSON.stringify(options)}`;
  let dtf = dtfStringCache.get(cacheKey);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(localeTag, options);
    dtfStringCache.set(cacheKey, dtf);
  }
  localeMap.set(localeTag, dtf);
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
