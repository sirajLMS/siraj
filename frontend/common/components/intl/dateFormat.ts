import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

type DateInput = Date | string | number;

function toDate(date: DateInput): Date {
  return date instanceof Date ? date : new Date(date);
}

/**
 * Locale-aware calendar date (e.g. "Jul 18, 2026" / Arabic with Latin numerals).
 */
export function formatDate(date: DateInput, locale: string): string {
  return new Intl.DateTimeFormat(getLatnLocaleTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(toDate(date));
}

/**
 * Locale-aware date and time (e.g. "Jul 18, 2026, 01:20 PM").
 */
export function formatDateTime(date: DateInput, locale: string): string {
  return new Intl.DateTimeFormat(getLatnLocaleTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(date));
}

/**
 * Locale-aware time (e.g. "01:20 PM").
 */
export function formatTime(date: DateInput, locale: string): string {
  return new Intl.DateTimeFormat(getLatnLocaleTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(date));
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
