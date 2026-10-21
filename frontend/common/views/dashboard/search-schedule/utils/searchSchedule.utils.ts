import { addDays, addMonths, differenceInCalendarDays, format, parse, subMonths } from "date-fns";
import { AvailabilitySearchSortBy } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TeacherAvailabilityGapItem } from "@/frontend/common/views/dashboard/search-schedule/types";

const ISO_DATE_FORMAT = "yyyy-MM-dd";

// NEW FOR PLAN v5: pure-data helpers lifted out of tier (N9/N10 closure). Strings in/out; no Date-object leakage downstream.

export function parseIsoDate(value: string): Date {
  return parse(value, ISO_DATE_FORMAT, new Date());
}

export function formatIsoDate(value: Date): string {
  return format(value, ISO_DATE_FORMAT);
}

export function formatDayPillLabel(calendarDate: string): string {
  const parsed = parseIsoDate(calendarDate);
  return format(parsed, "EEE d MMM").toUpperCase();
}

export function getColumnCount(fromDate: string, toDate: string): number {
  const start = parseIsoDate(fromDate);
  const end = parseIsoDate(toDate);
  return Math.max(differenceInCalendarDays(end, start) + 1, 1);
}

export function buildDateColumns(fromDate: string, toDate: string): string[] {
  const start = parseIsoDate(fromDate);
  const end = parseIsoDate(toDate);
  const dayCount = differenceInCalendarDays(end, start) + 1;
  return Array.from({ length: dayCount }, (_, index) => format(addDays(start, index), ISO_DATE_FORMAT));
}

/**
 * Single-pass grouping of gaps by calendar date.
 * Avoids quadratic array allocations by pushing directly into a pre-allocated array per date key.
 */
export function groupGapsByDate(
  gaps: readonly (TeacherAvailabilityGapItem | null)[] | null | undefined
): Map<string, readonly TeacherAvailabilityGapItem[]> {
  const grouped = new Map<string, TeacherAvailabilityGapItem[]>();
  for (const gap of gaps ?? []) {
    if (!gap?.calendarDate) {
      continue;
    }
    let list = grouped.get(gap.calendarDate);
    if (!list) {
      list = [];
      grouped.set(gap.calendarDate, list);
    }
    list.push(gap);
  }
  return grouped;
}

/**
 * Groups gaps by day of month for a target month and year.
 * Pre-computes target month/year outside the loop and parses ISO date strings ("YYYY-MM-DD")
 * without instantiating Date objects, eliminating GC overhead and quadratic array copies.
 */
export function groupGapsByDayOfMonth(
  gaps: readonly (TeacherAvailabilityGapItem | null)[] | null | undefined,
  month: Date
): Partial<Record<number, readonly TeacherAvailabilityGapItem[]>> {
  const grouped: Record<number, TeacherAvailabilityGapItem[]> = {};
  const targetMonth = month.getMonth();
  const targetYear = month.getFullYear();

  for (const gap of gaps ?? []) {
    if (!gap) {
      continue;
    }
    const calendarDate = gap.calendarDate;
    if (!calendarDate) {
      continue;
    }

    let year: number;
    let monthIndex: number;
    let day: number;

    if (calendarDate.length === 10) {
      year = Number(calendarDate.slice(0, 4));
      monthIndex = Number(calendarDate.slice(5, 7)) - 1;
      day = Number(calendarDate.slice(8, 10));
    } else {
      const parsed = new Date(calendarDate);
      year = parsed.getUTCFullYear();
      monthIndex = parsed.getUTCMonth();
      day = parsed.getUTCDate();
    }

    if (monthIndex !== targetMonth || year !== targetYear) {
      continue;
    }

    let list = grouped[day];
    if (!list) {
      list = [];
      grouped[day] = list;
    }
    list.push(gap);
  }

  return grouped;
}

export function formatGapLabel(gap: TeacherAvailabilityGapItem): string {
  return `${gap.gapStartTime ?? ""} - ${gap.gapEndTime ?? ""}`;
}

export type SortLabelKey = "mostAvailableDays" | "mostGaps" | "nameAsc" | "nameDesc" | "timezoneAsc";

export function getSortLabelKey(sortBy: AvailabilitySearchSortBy): SortLabelKey {
  switch (sortBy) {
    case AvailabilitySearchSortBy.MostGaps:
      return "mostGaps";
    case AvailabilitySearchSortBy.NameAsc:
      return "nameAsc";
    case AvailabilitySearchSortBy.NameDesc:
      return "nameDesc";
    case AvailabilitySearchSortBy.TimezoneAsc:
      return "timezoneAsc";
    default:
      return "mostAvailableDays";
  }
}

export function shiftMonth(month: Date, direction: 1 | -1): Date {
  return direction === 1 ? addMonths(month, 1) : subMonths(month, 1);
}
