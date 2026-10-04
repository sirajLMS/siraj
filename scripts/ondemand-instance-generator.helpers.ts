import { SHORT_WEEKDAY_TO_ENUM } from "@/scripts/ondemand-instance-generator.constants";

/**
 * Module-level caches for `Intl.DateTimeFormat` instances keyed by IANA timezone ID.
 * Instantiating `Intl.DateTimeFormat` inside loop bodies is up to 100x-200x slower
 * due to ICU/V8 runtime initialization overhead during daily batch instance generation.
 */
const shortWeekdayDtfCache = new Map<string, Intl.DateTimeFormat>();
const datePartsDtfCache = new Map<string, Intl.DateTimeFormat>();
const tzOffsetDtfCache = new Map<string, Intl.DateTimeFormat>();

export function getShortWeekdayDtf(ianaTimezone: string): Intl.DateTimeFormat {
  let dtf = shortWeekdayDtfCache.get(ianaTimezone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", { timeZone: ianaTimezone, weekday: "short" });
    shortWeekdayDtfCache.set(ianaTimezone, dtf);
  }
  return dtf;
}

function getDatePartsDtf(ianaTimezone: string): Intl.DateTimeFormat {
  let dtf = datePartsDtfCache.get(ianaTimezone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    datePartsDtfCache.set(ianaTimezone, dtf);
  }
  return dtf;
}

function getTzOffsetDtf(ianaTimezone: string): Intl.DateTimeFormat {
  let dtf = tzOffsetDtfCache.get(ianaTimezone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimezone,
      timeZoneName: "shortOffset",
    });
    tzOffsetDtfCache.set(ianaTimezone, dtf);
  }
  return dtf;
}

/**
 * Computes the scheduled start time for a given date using the schedule's IANA
 * timezone, so the hour/minute correspond to the wall-clock time in the student's
 * timezone rather than the server's local timezone (RC2-1).
 *
 * Returns a `Date` in UTC that represents the instant at which the given
 * `startHour:startMin` occurs on `currentDate` in `ianaTimezone`.
 */
export function computeStartAtInTimezone(
  currentDate: Date,
  startHour: number,
  startMin: number,
  ianaTimezone: string
): Date {
  // Extract the date components using cached Intl.DateTimeFormat instance to avoid CPU & GC overhead.
  const dateParts = getDatePartsDtf(ianaTimezone).formatToParts(currentDate);

  const getPart = (type: string): string => dateParts.find(p => p.type === type)?.value ?? "";

  const year = Number(getPart("year"));
  const month = Number(getPart("month")) - 1; // JS months are 0-based
  const day = Number(getPart("day"));

  // Build a UTC timestamp from the wall-clock time and resolve it back to the
  // correct instant using Intl's timezone offset.
  // (UTC equivalent of YYYY-MM-DDTHH:MM:00 in ianaTimezone)
  const asIfUtc = Date.UTC(year, month, day, startHour, startMin, 0, 0);

  // Calculate the offset between the IANA timezone and UTC at this instant using cached Intl.DateTimeFormat.
  const tzParts = getTzOffsetDtf(ianaTimezone).formatToParts(new Date(asIfUtc));

  const offsetStr = tzParts.find(p => p.type === "timeZoneName")?.value ?? "+0";
  // Parse offset strings like "GMT+5", "GMT-3:30", "GMT" (UTC)
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(offsetStr);
  const sign = match?.[1] === "-" ? -1 : 1;
  const hours = match ? Number(match[2]) : 0;
  const minutes = match?.[3] ? Number(match[3]) : 0;
  const offsetMinutes = sign * (hours * 60 + minutes);

  // Shift the as-if-UTC timestamp by the offset to get the true UTC instant.
  return new Date(asIfUtc - offsetMinutes * 60 * 1000);
}

/** Resolves the IANA-timezone-aware day-of-week for the current iteration date. */
export function resolveScheduleDOW(currentDate: Date, timezone: string): string | undefined {
  const fmt = getShortWeekdayDtf(timezone);
  const weekdayShort = fmt.format(currentDate);
  return SHORT_WEEKDAY_TO_ENUM[weekdayShort];
}
