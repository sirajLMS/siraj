import { logger } from "@/backend/lib/logger";
import { IANA_TIMEZONE_IDS } from "@/shared/constants/iana-timezones";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { isExcludedIanaTimezoneId, resolveExcludedIanaTimezoneId } from "@/shared/lib/timezone/excluded-iana-timezones";

const IANA_TIMEZONE_SET = new Set<string>(IANA_TIMEZONE_IDS);

/**
 * Cache Intl.DateTimeFormat instances to avoid expensive JS runtime ICU / DateTimeFormat
 * object instantiation on every date formatting or offset calculation call.
 * Primary cache is keyed on options object identity (WeakMap) to avoid JSON.stringify
 * serialization overhead on hot formatting and offset calculation paths.
 */
const optionsWeakCache = new WeakMap<Intl.DateTimeFormatOptions, Map<string, Intl.DateTimeFormat>>();

function getDtf(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  let localeMap = optionsWeakCache.get(options);
  if (!localeMap) {
    localeMap = new Map<string, Intl.DateTimeFormat>();
    optionsWeakCache.set(options, localeMap);
  }
  const key = `${locale}:${timeZone}`;
  let dtf = localeMap.get(key);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat(locale, { timeZone, ...options });
    localeMap.set(key, dtf);
  }
  return dtf;
}

const DATE_PARTS_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
};

const OFFSET_PARTS_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

function partsToEpochMs(parts: Intl.DateTimeFormatPart[]): number {
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.type === "year") year = +p.value;
    else if (p.type === "month") month = +p.value - 1;
    else if (p.type === "day") day = +p.value;
    else if (p.type === "hour") hour = +p.value === 24 ? 0 : +p.value;
    else if (p.type === "minute") minute = +p.value;
    else if (p.type === "second") second = +p.value;
  }
  return Date.UTC(year, month, day, hour, minute, second);
}

function getOffsetMs(ianaTimezone: string, d: Date): number {
  const tzDtf = getDtf("en-US", ianaTimezone, OFFSET_PARTS_OPTIONS);
  // d is a UTC Date instance; wall-clock UTC epoch ms truncated to seconds equals d.getTime() - d.getUTCMilliseconds().
  // Eliminating utcDtf.formatToParts(d) avoids extra Intl.DateTimeFormat execution and array allocations.
  const utcMs = d.getTime() - d.getUTCMilliseconds();
  return partsToEpochMs(tzDtf.formatToParts(d)) - utcMs;
}

/** UTC offset in milliseconds at `d`; falls back to 0 (treated as UTC) for invalid timezones. */
export function getOffsetMsSafe(ianaTimezone: string, d: Date): number {
  try {
    return getOffsetMs(ianaTimezone, d);
  } catch {
    return 0;
  }
}

/** UTC offset in minutes at `d`; returns null for invalid timezones. */
export function getOffsetMinutes(ianaTimezone: string, d: Date): number | null {
  try {
    return Math.round(getOffsetMs(ianaTimezone, d) / 60000);
  } catch {
    return null;
  }
}

export function normalizeIanaTimezone(value: string): string {
  return resolveExcludedIanaTimezoneId(value);
}

export function isValidIanaTimezone(value: string): boolean {
  const normalized = normalizeIanaTimezone(value);
  return !isExcludedIanaTimezoneId(normalized) && IANA_TIMEZONE_SET.has(normalized);
}

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
};

export function formatInstantInTimezone(date: Date, ianaTimezone: string, locale?: string): string {
  const localeTag = locale ? getLatnLocaleTag(locale) : "en-US";
  try {
    return getDtf(localeTag, ianaTimezone, TIME_FORMAT_OPTIONS).format(date);
  } catch (error) {
    logger.error("Failed to format date in timezone, falling back to UTC", {
      error,
      ianaTimezone,
      date: Number.isNaN(date.getTime()) ? "Invalid Date" : date.toISOString(),
    });
    return getDtf(localeTag, "UTC", TIME_FORMAT_OPTIONS).format(date);
  }
}

export function getDayBoundaries(date: Date, ianaTimezone: string): { startOfDayUtc: Date; endOfDayUtc: Date } {
  try {
    const dtf = getDtf("en-US", ianaTimezone, DATE_PARTS_OPTIONS);
    const parts = dtf.formatToParts(date);

    let yearPart: string | undefined;
    let monthPart: string | undefined;
    let dayPart: string | undefined;

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (p.type === "year") yearPart = p.value;
      else if (p.type === "month") monthPart = p.value;
      else if (p.type === "day") dayPart = p.value;
    }

    if (!yearPart || !monthPart || !dayPart) {
      throw new Error("Missing date parts");
    }

    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10) - 1;
    const day = Number.parseInt(dayPart, 10);

    const guessStart = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const offsetStart = getOffsetMs(ianaTimezone, guessStart);
    let startOfDayUtc = new Date(guessStart.getTime() - offsetStart);
    startOfDayUtc = new Date(guessStart.getTime() - getOffsetMs(ianaTimezone, startOfDayUtc));

    const guessEnd = new Date(Date.UTC(year, month, day, 24, 0, 0));
    const offsetEnd = getOffsetMs(ianaTimezone, guessEnd);
    let endOfDayUtc = new Date(guessEnd.getTime() - offsetEnd);
    endOfDayUtc = new Date(guessEnd.getTime() - getOffsetMs(ianaTimezone, endOfDayUtc));

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
