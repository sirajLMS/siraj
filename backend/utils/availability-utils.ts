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

/**
 * Fast time-to-minutes converter.
 * Parses "HH:MM" or "HH:MM:SS" without array allocations (`split`/`map`).
 */
export function timeToMinutes(time: string): number {
  const firstColon = time.indexOf(":");
  if (firstColon === -1) {
    return Number.parseInt(time, 10) * 60;
  }
  const secondColon = time.indexOf(":", firstColon + 1);
  const hours = Number.parseInt(time.slice(0, firstColon), 10);
  const minutes = Number.parseInt(
    secondColon === -1 ? time.slice(firstColon + 1) : time.slice(firstColon + 1, secondColon),
    10
  );
  return hours * 60 + minutes;
}

/**
 * Fast UTC time-to-string formatter ("HH:MM:SS") avoiding `padStart` overhead.
 */
export function dateToTimeString(date: Date): string {
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const sStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${hStr}:${mStr}:${sStr}`;
}

/** Minutes since UTC midnight — direct from the Date without a string round-trip. */
export function dateToMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function getUtcDayOfWeek(date: Date): DayOfWeek {
  return JS_DAY_TO_ENUM[date.getUTCDay()];
}

/** Fast YYYY-MM-DD extractor using `slice(0, 10)` to avoid `split` array allocations. */
export function getUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
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
  searchEnd: number,
  out: { start: number; end: number }[]
): void {
  for (let i = 0; i < dayUnavail.length; i++) {
    const u = dayUnavail[i];
    const uStart = timeToMinutes(u.startTime);
    const uEnd = timeToMinutes(u.endTime);
    if (uStart < searchEnd && uEnd > searchStart) {
      out.push({
        start: uStart < searchStart ? searchStart : uStart,
        end: uEnd > searchEnd ? searchEnd : uEnd,
      });
    }
  }
}

function mergeBlockedRanges(blockedRanges: { start: number; end: number }[]): { start: number; end: number }[] {
  if (blockedRanges.length <= 1) return blockedRanges;

  // In-place sort to avoid spread copy / toSorted allocation
  blockedRanges.sort((a, b) => a.start - b.start);
  const mergedBlocked: { start: number; end: number }[] = [blockedRanges[0]];

  for (let i = 1; i < blockedRanges.length; i++) {
    const range = blockedRanges[i];
    const last = mergedBlocked[mergedBlocked.length - 1];
    if (range.start <= last.end) {
      if (range.end > last.end) {
        last.end = range.end;
      }
    } else {
      mergedBlocked.push({ start: range.start, end: range.end });
    }
  }
  return mergedBlocked;
}

function formatMinutesToHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${hStr}:${mStr}`;
}

function createGap(
  teacher: TeacherShortInfo,
  day: DayOfWeek,
  calendarDate: string,
  startMinutes: number,
  endMinutes: number
): TeacherAvailabilityGap {
  return {
    id: `${teacher.teacherId}-${calendarDate}-${day}-${startMinutes}-${endMinutes}`,
    teacherId: teacher.teacherId,
    teacherName: teacher.teacherName ?? "Unknown",
    teacherGender: teacher.teacherGender,
    dayOfWeek: day,
    calendarDate,
    gapStartTime: formatMinutesToHHMM(startMinutes),
    gapEndTime: formatMinutesToHHMM(endMinutes),
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
  if (vacations.length === 0) return [];
  // Direct Date.parse and numeric addition avoid intermediate Date object instantiations and ISO string parsing
  const dayStartMs = Date.parse(`${calendarDate}T00:00:00.000Z`);
  const dayEndMs = dayStartMs + 86399999;
  const blocked: { start: number; end: number }[] = [];

  for (let i = 0; i < vacations.length; i++) {
    const vacation = vacations[i];
    const vStartMs = vacation.startAt.getTime();
    const vEndMs = vacation.endAt.getTime();
    if (vEndMs <= dayStartMs || vStartMs > dayEndMs) continue;
    const blockStart = vStartMs > dayStartMs ? dateToMinutes(vacation.startAt) : 0;
    const blockEnd = vEndMs < dayEndMs ? dateToMinutes(vacation.endAt) : 24 * 60;
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
  if (bookings.length === 0) return [];
  // Direct Date.parse and numeric addition avoid intermediate Date object instantiations and ISO string parsing
  const dayStartMs = Date.parse(`${calendarDate}T00:00:00.000Z`);
  const dayEndMs = dayStartMs + 86399999;
  const blocked: { start: number; end: number }[] = [];

  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];
    const bStartMs = booking.scheduledStartAt.getTime();
    const bEndMs = booking.scheduledEndAt.getTime();
    if (bEndMs <= dayStartMs || bStartMs > dayEndMs) continue;
    const blockStart = bStartMs > dayStartMs ? dateToMinutes(booking.scheduledStartAt) : 0;
    const blockEnd = bEndMs < dayEndMs ? dateToMinutes(booking.scheduledEndAt) : 24 * 60;
    if (blockStart < blockEnd) {
      blocked.push({ start: blockStart, end: blockEnd });
    }
  }
  return blocked;
}

function collectExtraBlocked(
  extraBlocked: { start: number; end: number }[],
  searchStart: number,
  searchEnd: number,
  out: { start: number; end: number }[]
): void {
  for (let j = 0; j < extraBlocked.length; j++) {
    const blocked = extraBlocked[j];
    if (blocked.start < searchEnd && blocked.end > searchStart) {
      out.push({
        start: blocked.start < searchStart ? searchStart : blocked.start,
        end: blocked.end > searchEnd ? searchEnd : blocked.end,
      });
    }
  }
}

export function findGapsForCalendarDate(options: FindGapsForCalendarDateOptions): TeacherAvailabilityGap[] {
  const { teacher, calendarDate, day, dayWindows, dayUnavail, extraBlocked, searchRange } = options;
  const { from: fromMinutes, to: toMinutes } = searchRange;
  const gaps: TeacherAvailabilityGap[] = [];

  for (let i = 0; i < dayWindows.length; i++) {
    const window = dayWindows[i];
    if (!isWithinEffectiveRange(calendarDate, window.effectiveFrom, window.effectiveUntil)) {
      continue;
    }

    const windowStart = timeToMinutes(window.startTime);
    const windowEnd = timeToMinutes(window.endTime);
    const searchStart = windowStart > fromMinutes ? windowStart : fromMinutes;
    const searchEnd = windowEnd < toMinutes ? windowEnd : toMinutes;

    if (searchStart >= searchEnd) continue;

    const blockedRanges: { start: number; end: number }[] = [];
    getBlockedRanges(dayUnavail, searchStart, searchEnd, blockedRanges);
    collectExtraBlocked(extraBlocked, searchStart, searchEnd, blockedRanges);

    const mergedBlocked = mergeBlockedRanges(blockedRanges);
    const windowGaps = generateGapsFromBlocked(teacher, day, calendarDate, searchStart, searchEnd, mergedBlocked);
    for (let k = 0; k < windowGaps.length; k++) {
      gaps.push(windowGaps[k]);
    }
  }

  return gaps;
}

export function countAvailableDays(gaps: TeacherAvailabilityGap[]): number {
  const uniqueDates = new Set<string>();
  for (let i = 0; i < gaps.length; i++) {
    uniqueDates.add(gaps[i].calendarDate);
  }
  return uniqueDates.size;
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
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let list = grouped.get(row.teacherId);
    if (!list) {
      list = [];
      grouped.set(row.teacherId, list);
    }
    list.push(row);
  }
  return grouped;
}
