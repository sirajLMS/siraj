import { addDays, format } from "date-fns";
import {
  AvailabilitySearchSortBy,
  type DayOfWeek,
  type SearchTeacherAvailabilityQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  AvailabilityEntry,
  AvailabilitySearchFormData,
  TeacherAvailabilityInsights,
  WeeklyAvailability,
} from "@/frontend/common/views/dashboard/teachers/availability/types";

export function buildGraphQLInput(formData: AvailabilitySearchFormData) {
  const fromTime = formData.fromTime
    ? `${String(formData.fromTime.getHours()).padStart(2, "0")}:${String(formData.fromTime.getMinutes()).padStart(2, "0")}`
    : "";
  const toTime = formData.toTime
    ? `${String(formData.toTime.getHours()).padStart(2, "0")}:${String(formData.toTime.getMinutes()).padStart(2, "0")}`
    : "";

  return {
    fromTime,
    toTime,
    fromDate: format(new Date(), "yyyy-MM-dd"),
    toDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    gender: formData.gender,
    minAvailableDays: null,
    minTotalGaps: null,
    teacherNameSearch: null,
    daysOfWeek: null,
    sortBy: AvailabilitySearchSortBy.MostAvailableDays,
    paginationArgs: null,
  };
}

type AvailabilitySearchData = NonNullable<SearchTeacherAvailabilityQuery["searchTeacherAvailability"]>;

type AvailabilityGap = {
  id: string | null;
  teacherId: string | null;
  teacherName: string | null;
  teacherGender: string | null;
  dayOfWeek: DayOfWeek | null;
  gapStartTime: string | null;
  gapEndTime: string | null;
  timezone: string | null;
};

function addGapToGrid(grid: Record<string, Partial<Record<DayOfWeek, AvailabilityEntry[]>>>, gap: AvailabilityGap) {
  if (!gap?.dayOfWeek || !gap.gapStartTime || !gap.gapEndTime) return;

  const timeKey = `${gap.gapStartTime}-${gap.gapEndTime}`;
  if (!grid[timeKey]) {
    grid[timeKey] = {};
  }

  const entry: AvailabilityEntry = {
    id: gap.id ?? "",
    teacherName: gap.teacherName ?? "Unknown",
    localTime: gap.gapStartTime,
  };

  const timeSlot = grid[timeKey];
  if (timeSlot) {
    const day = gap.dayOfWeek;
    timeSlot[day] ??= [];
    timeSlot[day].push(entry);
  }
}

export function transformToWeeklyAvailability(data: AvailabilitySearchData | null | undefined): WeeklyAvailability {
  if (!data?.teachers) return {};

  const grid: Record<string, Partial<Record<DayOfWeek, AvailabilityEntry[]>>> = {};

  for (const teacher of data.teachers) {
    if (!teacher?.gaps) continue;
    for (const gap of teacher.gaps) {
      addGapToGrid(grid, gap);
    }
  }

  return grid;
}

export function computeInsights(data: AvailabilitySearchData | null | undefined): TeacherAvailabilityInsights {
  if (!data?.teachers) {
    return { peakLoad: "", availableStaff: 0, timezones: [] };
  }

  const timeCount: Record<string, number> = {};
  const tzSet = new Set<string>();

  for (const teacher of data.teachers) {
    if (teacher?.timezone) tzSet.add(teacher.timezone);
    if (!teacher?.gaps) continue;
    for (const gap of teacher.gaps) {
      if (!gap?.gapStartTime) continue;
      const key = gap.gapStartTime;
      timeCount[key] = (timeCount[key] ?? 0) + 1;
    }
  }

  let peakLoad = "";
  let maxCount = 0;
  for (const [key, count] of Object.entries(timeCount)) {
    if (count > maxCount) {
      maxCount = count;
      peakLoad = key;
    }
  }

  return {
    peakLoad,
    availableStaff: data.teachers.filter(t => t.gaps?.some(g => g.gapStartTime)).length,
    timezones: Array.from(tzSet),
  };
}
