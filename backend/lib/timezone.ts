import { logger } from "@/backend/lib/logger";
import { IANA_TIMEZONE_IDS } from "@/shared/constants/iana-timezones";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { isExcludedIanaTimezoneId, resolveExcludedIanaTimezoneId } from "@/shared/lib/timezone/excluded-iana-timezones";

const IANA_TIMEZONE_SET = new Set<string>(IANA_TIMEZONE_IDS);

export function normalizeIanaTimezone(value: string): string {
  return resolveExcludedIanaTimezoneId(value);
}

export function isValidIanaTimezone(value: string): boolean {
  const normalized = normalizeIanaTimezone(value);
  return !isExcludedIanaTimezoneId(normalized) && IANA_TIMEZONE_SET.has(normalized);
}

export function formatInstantInTimezone(date: Date, ianaTimezone: string, locale?: string): string {
  const localeTag = locale ? getLatnLocaleTag(locale) : "en-US";
  try {
    return new Intl.DateTimeFormat(localeTag, {
      timeZone: ianaTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    logger.error("Failed to format date in timezone, falling back to UTC", {
      error,
      ianaTimezone,
      date: Number.isNaN(date.getTime()) ? "Invalid Date" : date.toISOString(),
    });
    return new Intl.DateTimeFormat(localeTag, {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }
}

/**
 * Cache Intl.DateTimeFormat instances per timezone to avoid heavy instantiation
 * overhead during date/time offset calculations.
 */
const tzPartsFormatterCache = new Map<string, Intl.DateTimeFormat>();
const utcPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getTzPartsFormatter(ianaTimezone: string): Intl.DateTimeFormat {
  let dtf = tzPartsFormatterCache.get(ianaTimezone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    tzPartsFormatterCache.set(ianaTimezone, dtf);
  }
  return dtf;
}

function partsToEpochMs(parts: Intl.DateTimeFormatPart[]): number {
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.type === "year") year = Number(p.value);
    else if (p.type === "month") month = Number(p.value) - 1;
    else if (p.type === "day") day = Number(p.value);
    else if (p.type === "hour") hour = Number(p.value) === 24 ? 0 : Number(p.value);
    else if (p.type === "minute") minute = Number(p.value);
    else if (p.type === "second") second = Number(p.value);
  }
  return Date.UTC(year, month, day, hour, minute, second);
}

/**
 * Computes the UTC offset in milliseconds for a given timezone and instant.
 * Fast, cached implementation replacing slow `toLocaleString` calls.
 */
export function getTimezoneOffsetMs(ianaTimezone: string, date: Date): number {
  const dtf = getTzPartsFormatter(ianaTimezone);
  const asTz = partsToEpochMs(dtf.formatToParts(date));
  const asUtc = partsToEpochMs(utcPartsFormatter.formatToParts(date));
  return asTz - asUtc;
}

export function getDayBoundaries(date: Date, ianaTimezone: string): { startOfDayUtc: Date; endOfDayUtc: Date } {
  try {
    const parts = getTzPartsFormatter(ianaTimezone).formatToParts(date);

    const yearPart = parts.find(p => p.type === "year")?.value;
    const monthPart = parts.find(p => p.type === "month")?.value;
    const dayPart = parts.find(p => p.type === "day")?.value;

    if (!yearPart || !monthPart || !dayPart) {
      throw new Error("Missing date parts");
    }

    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10) - 1;
    const day = Number.parseInt(dayPart, 10);

    const guessStart = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const offsetStart = getTimezoneOffsetMs(ianaTimezone, guessStart);
    let startOfDayUtc = new Date(guessStart.getTime() - offsetStart);
    startOfDayUtc = new Date(guessStart.getTime() - getTimezoneOffsetMs(ianaTimezone, startOfDayUtc));

    const guessEnd = new Date(Date.UTC(year, month, day, 24, 0, 0));
    const offsetEnd = getTimezoneOffsetMs(ianaTimezone, guessEnd);
    let endOfDayUtc = new Date(guessEnd.getTime() - offsetEnd);
    endOfDayUtc = new Date(guessEnd.getTime() - getTimezoneOffsetMs(ianaTimezone, endOfDayUtc));

    return { startOfDayUtc, endOfDayUtc };
  } catch (error) {
    logger.error("Failed to calculate day boundaries, falling back to UTC", {
      error,
      ianaTimezone,
      date: Number.isNaN(date.getTime()) ? "Invalid Date" : date.toISOString(),
    });
    const fallbackDate = Number.isNaN(date.getTime()) ? new Date() : date;
    const startOfDayUtc = new Date(fallbackDate);
    startOfDayUtc.setUTCHours(0, 0, 0, 0);
    const endOfDayUtc = new Date(fallbackDate);
    endOfDayUtc.setUTCHours(24, 0, 0, 0);
    return { startOfDayUtc, endOfDayUtc };
  }
}
