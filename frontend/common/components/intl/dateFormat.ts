import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

type DateInput = Date | string | number;

export function parseDateInput(date: DateInput): Date | null {
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

  return new Intl.DateTimeFormat(getLatnLocaleTag(locale), options).format(parsed);
}

/**
 * Locale-aware calendar date (e.g. "Jul 18, 2026" / Arabic with Latin numerals).
 */
export function formatDate(date: DateInput, locale: string, fallback = "—"): string {
  return formatWithFallback(
    date,
    locale,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
    fallback
  );
}

/**
 * Locale-aware date and time (e.g. "Jul 18, 2026, 01:20 PM").
 */
export function formatDateTime(date: DateInput, locale: string, fallback = "—"): string {
  return formatWithFallback(
    date,
    locale,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    fallback
  );
}

/**
 * Locale-aware time (e.g. "01:20 PM").
 */
export function formatTime(date: DateInput, locale: string, fallback = "—"): string {
  return formatWithFallback(
    date,
    locale,
    {
      hour: "2-digit",
      minute: "2-digit",
    },
    fallback
  );
}

/**
 * Locale-aware month and year (e.g. "July 2026").
 */
export function formatMonthYear(date: DateInput, locale: string): string {
  return new Intl.DateTimeFormat(getLatnLocaleTag(locale), {
    year: "numeric",
    month: "long",
  }).format(toDate(date));
}
