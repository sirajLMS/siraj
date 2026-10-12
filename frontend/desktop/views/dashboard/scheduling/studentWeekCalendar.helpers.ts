import { alpha, type Theme } from "@mui/material/styles";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import type { StudentClassRow } from "@/frontend/common/views/dashboard/scheduling/student-week-calendar/useStudentWeekCalendarViewModel";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

// Module-level options objects so getDateTimeFormatter hits its WeakMap
// tier-1 cache by options identity instead of allocating fresh instances.
const HOUR_NUMERIC_OPTIONS: Intl.DateTimeFormatOptions = { hour: "numeric", hour12: true };
const WEEKDAY_SHORT_OPTIONS: Intl.DateTimeFormatOptions = { weekday: "short" };

// Visible-but-subtle grid line color — derived from text.primary so it adapts
// to light/dark themes.
export const gridLineColor = (theme: Theme) => alpha(theme.palette.text.primary, 0.08);

/**
 * Cache of formatted hour strings keyed by `${latnLocaleTag}:${hour}`.
 * Instantiating `new Date` and formatting hour strings on every grid render
 * creates unnecessary GC pressure and CPU overhead.
 */
const hourFormatCache = new Map<string, string>();

export function formatHour(hour: number, locale: string): string {
  const latnTag = getLatnLocaleTag(locale);
  const cacheKey = `${latnTag}:${hour}`;
  let formatted = hourFormatCache.get(cacheKey);
  if (!formatted) {
    formatted = getDateTimeFormatter(latnTag, HOUR_NUMERIC_OPTIONS).format(new Date(0, 0, 0, hour));
    hourFormatCache.set(cacheKey, formatted);
  }
  return formatted;
}

export function createWeekdayFormatter(locale: string): Intl.DateTimeFormat {
  return getDateTimeFormatter(getLatnLocaleTag(locale), WEEKDAY_SHORT_OPTIONS);
}

export function dayKeyOf(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

// Group classes by local calendar day so each day column resolves its
// sessions with a single map lookup instead of filtering the full list.
export function groupClassesByDayKey(classes: readonly StudentClassRow[]): Map<string, StudentClassRow[]> {
  const map = new Map<string, StudentClassRow[]>();
  for (const cls of classes) {
    const parsed = new Date(cls.scheduledStartAt);
    if (Number.isNaN(parsed.getTime())) continue;
    const key = dayKeyOf(parsed);
    let list = map.get(key);
    if (!list) {
      list = [];
      map.set(key, list);
    }
    list.push(cls);
  }
  return map;
}
