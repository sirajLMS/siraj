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

export function groupGapsByDate(
  gaps: readonly (TeacherAvailabilityGapItem | null)[] | null | undefined
): Map<string, readonly TeacherAvailabilityGapItem[]> {
  const grouped = new Map<string, TeacherAvailabilityGapItem[]>();
  for (const gap of gaps ?? []) {
    if (!gap?.calendarDate) {
      continue;
    }
    const existing = grouped.get(gap.calendarDate) ?? [];
    grouped.set(gap.calendarDate, [...existing, gap]);
  }
  return grouped;
}

export function groupGapsByDayOfMonth(
  gaps: readonly (TeacherAvailabilityGapItem | null)[] | null | undefined,
  month: Date
): Partial<Record<number, readonly TeacherAvailabilityGapItem[]>> {
  const grouped: Record<number, TeacherAvailabilityGapItem[]> = {};

  for (const gap of gaps ?? []) {
    if (!gap) {
      continue;
    }
    const calendarDate = gap.calendarDate;
    if (!calendarDate) {
      continue;
    }

    const parsed = parseIsoDate(calendarDate);
    if (parsed.getMonth() !== month.getMonth() || parsed.getFullYear() !== month.getFullYear()) {
      continue;
    }

    const day = parsed.getDate();
    grouped[day] = [...(grouped[day] ?? []), gap];
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
