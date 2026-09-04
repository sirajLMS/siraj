import { type DayOfWeek, VacationRequestStatus } from "@/backend/enum";
import { ValidationError } from "@/backend/lib/errors";
import type { TeacherAvailabilityWindowSelectType, TeacherRecurringUnavailabilitySelectType } from "@/backend/types";
import {
  dateToMinutes,
  getUtcDateString,
  getUtcDayOfWeek,
  isWithinEffectiveRange,
  timeToMinutes,
} from "@/backend/utils/availability-utils";
import { getServerTranslations } from "@/shared/locale";

// Re-export shared utilities so existing consumers of this module are unaffected.
export { dateToMinutes, getUtcDateString, timeToMinutes };

// ── Pure validation helpers (no DB, no error throws) ─────────────────────────

function dayOfWeekEquals(value: string, day: DayOfWeek): boolean {
  const dayStr: string = day;
  return value === dayStr;
}

function timesOverlap(
  bookingStartMinutes: number,
  bookingEndMinutes: number,
  windowStartMinutes: number,
  windowEndMinutes: number
): boolean {
  return bookingStartMinutes < windowEndMinutes && bookingEndMinutes > windowStartMinutes;
}

function isWithinTimeWindow(
  bookingStartMinutes: number,
  bookingEndMinutes: number,
  windowStartMinutes: number,
  windowEndMinutes: number
): boolean {
  return bookingStartMinutes >= windowStartMinutes && bookingEndMinutes <= windowEndMinutes;
}

/** Pure vacation overlap check */
function checkVacationOverlap(startTime: Date, endTime: Date, vacations: { startAt: Date; endAt: Date }[]): boolean {
  return vacations.some(v => v.startAt < endTime && v.endAt > startTime);
}

/** Pure unavailability pattern check */
function checkUnavailabilityConflict(
  bookingDate: string,
  bookingDay: DayOfWeek,
  bookingStartMinutes: number,
  bookingEndMinutes: number,
  patterns: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    effectiveFrom: string | null;
    effectiveUntil: string | null;
  }[]
): boolean {
  for (const pattern of patterns) {
    if (!dayOfWeekEquals(pattern.dayOfWeek, bookingDay)) continue;
    if (!isWithinEffectiveRange(bookingDate, pattern.effectiveFrom, pattern.effectiveUntil)) continue;
    if (
      timesOverlap(
        bookingStartMinutes,
        bookingEndMinutes,
        timeToMinutes(pattern.startTime),
        timeToMinutes(pattern.endTime)
      )
    ) {
      return true;
    }
  }
  return false;
}

/** Pure availability window check */
function checkWindowsMatch(
  bookingDate: string,
  bookingDay: DayOfWeek,
  bookingStartMinutes: number,
  bookingEndMinutes: number,
  windows: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    effectiveFrom: string | null;
    effectiveUntil: string | null;
  }[]
): boolean {
  if (windows.length === 0) return true;
  return windows.some(window => {
    if (!dayOfWeekEquals(window.dayOfWeek, bookingDay)) return false;
    if (!isWithinEffectiveRange(bookingDate, window.effectiveFrom, window.effectiveUntil)) return false;
    return isWithinTimeWindow(
      bookingStartMinutes,
      bookingEndMinutes,
      timeToMinutes(window.startTime),
      timeToMinutes(window.endTime)
    );
  });
}

// ── In-memory slot validation (used by batch methods) ────────────────────────

/**
 * Validates a single slot in-memory using pre-fetched rows.
 * Throws the first conflict error encountered.
 */
export function validateSlotInMemory(
  slot: { startTime: Date; endTime: Date },
  vacationsRows: { startAt: Date; endAt: Date }[],
  unavailabilityRows: TeacherRecurringUnavailabilitySelectType[],
  windowRows: TeacherAvailabilityWindowSelectType[],
  locale?: string
): void {
  const bookingDate = getUtcDateString(slot.startTime);
  const bookingDay = getUtcDayOfWeek(slot.startTime);
  const bookingStartMinutes = dateToMinutes(slot.startTime);
  const bookingEndMinutes = dateToMinutes(slot.endTime);

  if (checkVacationOverlap(slot.startTime, slot.endTime, vacationsRows)) {
    const { teacherOnVacation } = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new ValidationError(teacherOnVacation);
  }

  if (
    checkUnavailabilityConflict(bookingDate, bookingDay, bookingStartMinutes, bookingEndMinutes, unavailabilityRows)
  ) {
    const { teacherUnavailabilityConflict } = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new ValidationError(teacherUnavailabilityConflict);
  }

  if (!checkWindowsMatch(bookingDate, bookingDay, bookingStartMinutes, bookingEndMinutes, windowRows)) {
    const { outsideAvailability } = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new ValidationError(outsideAvailability);
  }
}

// ── Batch slot bounds ────────────────────────────────────────────────────────

export function computeSlotBounds(slots: { startTime: Date; endTime: Date }[]): {
  earliestStart: Date;
  latestEnd: Date;
} {
  const earliestStart = new Date(Math.min(...slots.map(s => s.startTime.getTime())));
  const latestEnd = new Date(Math.max(...slots.map(s => s.endTime.getTime())));
  return { earliestStart, latestEnd };
}

// ── Vacation status validation ───────────────────────────────────────────────

export function isVacationRequestStatus(value: unknown): value is VacationRequestStatus {
  return (
    value === VacationRequestStatus.PENDING ||
    value === VacationRequestStatus.APPROVED ||
    value === VacationRequestStatus.REJECTED ||
    value === VacationRequestStatus.CANCELLED
  );
}
