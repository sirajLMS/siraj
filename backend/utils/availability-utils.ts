import { AvailabilitySearchSortBy, DayOfWeek } from "@/backend/enum";
import type {
  AvailabilitySearchTeacher,
  TeacherAvailabilityGap,
  TeacherAvailabilityWindowSelectType,
  TeacherRecurringUnavailabilitySelectType,
} from "@/backend/types";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

// ── Constants ───────────────────────────────────────────────────────────────

const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface TeacherShortInfo {
  teacherId: string;
  teacherName: string | null;
  teacherGender: string | null;
  teacherTimezone: IanaTimezone;
}

export interface MinuteRange {
  from: number;
  to: number;
}

export interface FindGapsForCalendarDateOptions {
  teacher: TeacherShortInfo;
  calendarDate: string;
  day: DayOfWeek;
  dayWindows: TeacherAvailabilityWindowSelectType[];
  dayUnavail: TeacherRecurringUnavailabilitySelectType[];
  extraBlocked: { start: number; end: number }[];
  searchRange: MinuteRange;
}

// ── Time / date utilities (pure, no side-effects) ───────────────────────────

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function dateToTimeString(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function getUtcDayOfWeek(date: Date): DayOfWeek {
  return JS_DAY_TO_ENUM[date.getUTCDay()];
}

export function getUtcDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ── Pure validation helpers (no DB, no error throws) ─────────────────────────

export function isWithinEffectiveRange(
  bookingDate: string,
  effectiveFrom: string | null,
  effectiveUntil: string | null
): boolean {
  if (effectiveFrom && bookingDate < effectiveFrom) return false;
  if (effectiveUntil && bookingDate > effectiveUntil) return false;
  return true;
}

// ── Search / gap computation helpers ─────────────────────────────────────────

function getBlockedRanges(
  dayUnavail: TeacherRecurringUnavailabilitySelectType[],
  searchStart: number,
  searchEnd: number
): { start: number; end: number }[] {
  const blockedRanges: { start: number; end: number }[] = [];
  for (const u of dayUnavail) {
    const uStart = timeToMinutes(u.startTime);
    const uEnd = timeToMinutes(u.endTime);
    if (uStart < searchEnd && uEnd > searchStart) {
      blockedRanges.push({
        start: Math.max(uStart, searchStart),
        end: Math.min(uEnd, searchEnd),
      });
    }
  }
  return blockedRanges;
}

function mergeBlockedRanges(blockedRanges: { start: number; end: number }[]): { start: number; end: number }[] {
  const sorted = [...blockedRanges].toSorted((a, b) => a.start - b.start);
  const mergedBlocked: { start: number; end: number }[] = [];
  for (const range of sorted) {
    const last = mergedBlocked.at(-1);
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      mergedBlocked.push({ ...range });
    }
  }
  return mergedBlocked;
}

function createGap(
  teacher: TeacherShortInfo,
  day: DayOfWeek,
  calendarDate: string,
  startMinutes: number,
  endMinutes: number
): TeacherAvailabilityGap {
  const startHoursStr = String(Math.floor(startMinutes / 60)).padStart(2, "0");
  const startMinutesStr = String(startMinutes % 60).padStart(2, "0");
  const endHoursStr = String(Math.floor(endMinutes / 60)).padStart(2, "0");
  const endMinutesStr = String(endMinutes % 60).padStart(2, "0");

  return {
    id: `${teacher.teacherId}-${calendarDate}-${day}-${startMinutes}-${endMinutes}`,
    teacherId: teacher.teacherId,
    teacherName: teacher.teacherName ?? "Unknown",
    teacherGender: teacher.teacherGender,
    dayOfWeek: day,
    calendarDate,
    gapStartTime: `${startHoursStr}:${startMinutesStr}`,
    gapEndTime: `${endHoursStr}:${endMinutesStr}`,
    timezone: teacher.teacherTimezone,
  };
}

function generateGapsFromBlocked(
  teacher: TeacherShortInfo,
  day: DayOfWeek,
  calendarDate: string,
  searchStart: number,
  searchEnd: number,
  mergedBlocked: { start: number; end: number }[]
): TeacherAvailabilityGap[] {
  const gaps: TeacherAvailabilityGap[] = [];
  let cursor = searchStart;
  for (const blocked of mergedBlocked) {
    if (cursor < blocked.start) {
      gaps.push(createGap(teacher, day, calendarDate, cursor, blocked.start));
    }
    cursor = Math.max(cursor, blocked.end);
  }
  if (cursor < searchEnd) {
    gaps.push(createGap(teacher, day, calendarDate, cursor, searchEnd));
  }
  return gaps;
}

export function expandDateRange(fromDate: string, toDate: string): string[] {
  const dates: string[] = [];
  let currentMs = Date.parse(`${fromDate}T00:00:00.000Z`);
  const endMs = Date.parse(`${toDate}T00:00:00.000Z`);
  while (currentMs <= endMs) {
    dates.push(getUtcDateString(new Date(currentMs)));
    currentMs += 24 * 60 * 60 * 1000;
  }
  return dates;
}

export function getDayOfWeekFromDateString(dateStr: string): DayOfWeek {
  return getUtcDayOfWeek(new Date(`${dateStr}T00:00:00.000Z`));
}

export function getVacationBlockedRangesForDate(
  calendarDate: string,
  vacations: { startAt: Date; endAt: Date }[]
): { start: number; end: number }[] {
  const dayStart = new Date(`${calendarDate}T00:00:00.000Z`);
  const dayEnd = new Date(`${calendarDate}T23:59:59.999Z`);
  const blocked: { start: number; end: number }[] = [];

  for (const vacation of vacations) {
    if (vacation.endAt <= dayStart || vacation.startAt > dayEnd) continue;
    const blockStart = vacation.startAt > dayStart ? timeToMinutes(dateToTimeString(vacation.startAt)) : 0;
    const blockEnd = vacation.endAt < dayEnd ? timeToMinutes(dateToTimeString(vacation.endAt)) : 24 * 60;
    if (blockStart < blockEnd) {
      blocked.push({ start: blockStart, end: blockEnd });
    }
  }
  return blocked;
}

export function getBookingBlockedRangesForDate(
  calendarDate: string,
  bookings: { scheduledStartAt: Date; scheduledEndAt: Date }[]
): { start: number; end: number }[] {
  const blocked: { start: number; end: number }[] = [];
  for (const booking of bookings) {
    const bookingDate = getUtcDateString(booking.scheduledStartAt);
    if (bookingDate !== calendarDate) continue;
    blocked.push({
      start: timeToMinutes(dateToTimeString(booking.scheduledStartAt)),
      end: timeToMinutes(dateToTimeString(booking.scheduledEndAt)),
    });
  }
  return blocked;
}

export function findGapsForCalendarDate(options: FindGapsForCalendarDateOptions): TeacherAvailabilityGap[] {
  const { teacher, calendarDate, day, dayWindows, dayUnavail, extraBlocked, searchRange } = options;
  const { from: fromMinutes, to: toMinutes } = searchRange;
  const gaps: TeacherAvailabilityGap[] = [];
  const effectiveWindows = dayWindows.filter(window =>
    isWithinEffectiveRange(calendarDate, window.effectiveFrom, window.effectiveUntil)
  );

  for (const window of effectiveWindows) {
    const windowStart = timeToMinutes(window.startTime);
    const windowEnd = timeToMinutes(window.endTime);
    const searchStart = Math.max(windowStart, fromMinutes);
    const searchEnd = Math.min(windowEnd, toMinutes);

    if (searchStart >= searchEnd) continue;

    const clippedExtra = extraBlocked
      .filter(blocked => blocked.start < searchEnd && blocked.end > searchStart)
      .map(blocked => ({
        start: Math.max(blocked.start, searchStart),
        end: Math.min(blocked.end, searchEnd),
      }));

    const blockedRanges = [...getBlockedRanges(dayUnavail, searchStart, searchEnd), ...clippedExtra];
    const mergedBlocked = mergeBlockedRanges(blockedRanges);
    const windowGaps = generateGapsFromBlocked(teacher, day, calendarDate, searchStart, searchEnd, mergedBlocked);
    gaps.push(...windowGaps);
  }

  return gaps;
}

export function countAvailableDays(gaps: TeacherAvailabilityGap[]): number {
  return new Set(gaps.map(gap => gap.calendarDate)).size;
}

export function sortTeachers(
  teacherResults: AvailabilitySearchTeacher[],
  sortBy: AvailabilitySearchSortBy | null | undefined
): AvailabilitySearchTeacher[] {
  const sorted = [...teacherResults];

  switch (sortBy) {
    case AvailabilitySearchSortBy.NAME_DESC:
      sorted.sort((left, right) => right.name.localeCompare(left.name));
      break;
    case AvailabilitySearchSortBy.MOST_GAPS:
      sorted.sort((left, right) => right.gaps.length - left.gaps.length);
      break;
    case AvailabilitySearchSortBy.MOST_AVAILABLE_DAYS:
      sorted.sort((left, right) => right.availableDaysCount - left.availableDaysCount);
      break;
    case AvailabilitySearchSortBy.TIMEZONE_ASC:
      sorted.sort((left, right) => left.timezone.localeCompare(right.timezone));
      break;
    default:
      sorted.sort((left, right) => left.name.localeCompare(right.name));
      break;
  }

  return sorted;
}

export function groupByTeacherId<T extends { teacherId: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const list = grouped.get(row.teacherId) ?? [];
    list.push(row);
    grouped.set(row.teacherId, list);
  }
  return grouped;
}
