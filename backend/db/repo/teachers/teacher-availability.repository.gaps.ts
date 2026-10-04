import type { BuildTeacherSearchResultsOptions } from "@/backend/db/repo/teachers/teacher-availability.repository.queries";
import type { DayOfWeek } from "@/backend/enum";
import type * as Types from "@/backend/types";
import {
  countAvailableDays,
  findGapsForCalendarDate,
  getBookingBlockedRangesForDate,
  getDayOfWeekFromDateString,
  getUtcDateString,
  getVacationBlockedRangesForDate,
  isWithinEffectiveRange,
  type MinuteRange,
  type TeacherShortInfo,
} from "@/backend/utils";
import { parseDayOfWeek, parseGender } from "@/shared/lib/enum";

function groupByDayOfWeek<T extends { dayOfWeek: string }>(rows: T[]): Map<DayOfWeek, T[]> {
  const map = new Map<DayOfWeek, T[]>();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const dayEnum = parseDayOfWeek(row.dayOfWeek);
    if (!dayEnum) continue;
    let list = map.get(dayEnum);
    if (!list) {
      list = [];
      map.set(dayEnum, list);
    }
    list.push(row);
  }
  return map;
}

function groupBookingsByDate(
  bookings: { scheduledStartAt: Date; scheduledEndAt: Date }[]
): Map<string, { scheduledStartAt: Date; scheduledEndAt: Date }[]> {
  const map = new Map<string, { scheduledStartAt: Date; scheduledEndAt: Date }[]>();
  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i];
    const startDateStr = getUtcDateString(b.scheduledStartAt);
    let startList = map.get(startDateStr);
    if (!startList) {
      startList = [];
      map.set(startDateStr, startList);
    }
    startList.push(b);

    const endDateStr = getUtcDateString(b.scheduledEndAt);
    if (endDateStr !== startDateStr) {
      let endList = map.get(endDateStr);
      if (!endList) {
        endList = [];
        map.set(endDateStr, endList);
      }
      endList.push(b);
    }
  }
  return map;
}

function computeTeacherGapsForDate(
  teacher: TeacherShortInfo,
  calendarDate: string,
  day: DayOfWeek,
  windowsByDay: Map<DayOfWeek, Types.TeacherAvailabilityWindowSelectType[]>,
  unavailByDay: Map<DayOfWeek, Types.TeacherRecurringUnavailabilitySelectType[]>,
  bookingsByDate: Map<string, { scheduledStartAt: Date; scheduledEndAt: Date }[]>,
  vacations: { startAt: Date; endAt: Date }[],
  timeRange: MinuteRange
): Types.TeacherAvailabilityGap[] {
  const dayWindows = windowsByDay.get(day) ?? [];
  if (dayWindows.length === 0) return [];

  const candidateUnavail = unavailByDay.get(day) ?? [];
  const dayUnavail: Types.TeacherRecurringUnavailabilitySelectType[] = [];
  for (let uIdx = 0; uIdx < candidateUnavail.length; uIdx++) {
    const u = candidateUnavail[uIdx];
    if (isWithinEffectiveRange(calendarDate, u.effectiveFrom, u.effectiveUntil)) {
      dayUnavail.push(u);
    }
  }

  const dateBookings = bookingsByDate.get(calendarDate) ?? [];
  const vacationBlocked = getVacationBlockedRangesForDate(calendarDate, vacations);
  const bookingBlocked = getBookingBlockedRangesForDate(calendarDate, dateBookings);

  let extraBlocked: { start: number; end: number }[];
  if (vacationBlocked.length === 0) {
    extraBlocked = bookingBlocked;
  } else if (bookingBlocked.length === 0) {
    extraBlocked = vacationBlocked;
  } else {
    extraBlocked = vacationBlocked.concat(bookingBlocked);
  }

  return findGapsForCalendarDate({
    teacher,
    calendarDate,
    day,
    dayWindows,
    dayUnavail,
    extraBlocked,
    searchRange: timeRange,
  });
}

export function buildTeacherSearchResults(
  options: BuildTeacherSearchResultsOptions
): Types.AvailabilitySearchTeacher[] {
  const { allTeachers, availabilityData, dateFilter, timeRange, minResultCriteria } = options;
  const { windowsByTeacher, unavailabilitiesByTeacher, vacationsByTeacher, bookingsByTeacher } = availabilityData;
  const { calendarDates, allowedDays } = dateFilter;
  const { minAvailableDays, minTotalGaps } = minResultCriteria;
  const result: Types.AvailabilitySearchTeacher[] = [];

  for (let tIdx = 0; tIdx < allTeachers.length; tIdx++) {
    const teacher = allTeachers[tIdx];
    const windowsByDay = groupByDayOfWeek(windowsByTeacher.get(teacher.teacherId) ?? []);
    const unavailByDay = groupByDayOfWeek(unavailabilitiesByTeacher.get(teacher.teacherId) ?? []);
    const bookingsByDate = groupBookingsByDate(bookingsByTeacher.get(teacher.teacherId) ?? []);
    const vacations = vacationsByTeacher.get(teacher.teacherId) ?? [];
    const gaps: Types.TeacherAvailabilityGap[] = [];

    for (let d = 0; d < calendarDates.length; d++) {
      const calendarDate = calendarDates[d];
      const day = getDayOfWeekFromDateString(calendarDate);
      if (allowedDays && !allowedDays.has(day)) {
        continue;
      }

      const dayGaps = computeTeacherGapsForDate(
        teacher,
        calendarDate,
        day,
        windowsByDay,
        unavailByDay,
        bookingsByDate,
        vacations,
        timeRange
      );
      for (let gIdx = 0; gIdx < dayGaps.length; gIdx++) {
        gaps.push(dayGaps[gIdx]);
      }
    }

    const availableDaysCount = countAvailableDays(gaps);
    const meetsMinDays = minAvailableDays == null || availableDaysCount >= minAvailableDays;
    const meetsMinGaps = minTotalGaps == null || gaps.length >= minTotalGaps;

    if (gaps.length > 0 && meetsMinDays && meetsMinGaps) {
      result.push({
        id: teacher.teacherId,
        name: teacher.teacherName ?? "Unknown",
        gender: parseGender(teacher.teacherGender),
        timezone: teacher.teacherTimezone,
        availableDaysCount,
        gaps,
      });
    }
  }

  return result;
}
