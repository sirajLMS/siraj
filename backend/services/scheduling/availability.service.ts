import type { DBTransaction } from "@/backend/db/db.types";
import type { db } from "@/backend/db/drizzleDb";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teachers/teacher-availability.repository";
import type { AvailableClassSlotReturnType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

type ReadExecutor = DBTransaction | typeof db;

// Helper to cast ReadExecutor to DBTransaction for repository calls
const txParam = (tx?: ReadExecutor): DBTransaction | undefined => (tx ? (tx as DBTransaction) : undefined);

export interface SlotAvailabilityInput {
  studentId: string;
  teacherId: string;
  startAt: Date;
  endAt: Date;
  ignoreInstanceIds?: string[];
  locale?: string;
}

export namespace AvailabilityService {
  export const isSlotAvailable = async (
    studentId: string,
    teacherId: string,
    startAt: Date,
    endAt: Date,
    ignoreInstanceIds: string[] = [],
    tx?: ReadExecutor,
    locale?: string
  ): Promise<boolean> => {
    const hasConflict = await SchedulingRepository.hasOverlappingInstance(
      studentId,
      teacherId,
      startAt,
      endAt,
      ignoreInstanceIds,
      txParam(tx)
    );

    if (hasConflict) return false;

    // Check teacher availability windows, unavailability, and vacations
    try {
      await TeacherAvailabilityRepository.validateBookingAvailability(
        teacherId,
        startAt,
        endAt,
        txParam(tx),
        locale ?? "en"
      );
    } catch {
      return false;
    }

    return true;
  };

  export const assertSlotAvailable = async (
    studentId: string,
    teacherId: string,
    startAt: Date,
    endAt: Date,
    ignoreInstanceIds: string[] = [],
    locale = "en",
    tx?: ReadExecutor
  ): Promise<void> => {
    const available = await isSlotAvailable(studentId, teacherId, startAt, endAt, ignoreInstanceIds, tx, locale);
    if (!available) {
      // TODO: No dedicated slotUnavailable translation key exists in the errors namespace.
      // Reusing invalidInput as the closest match. Add a slotUnavailable key if user-facing clarity is needed.
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.invalidInput);
    }
  };

  export const assertSchedulePatternAvailable = async (
    studentId: string,
    teacherId: string,
    days: { dayOfWeek: string; startTime: string }[],
    startDate: Date,
    endDate: Date,
    ignoreInstanceIds: string[] = [],
    locale = "en",
    tx?: ReadExecutor,
    durationMinutes = 60,
    timezone: string = "UTC"
  ): Promise<void> => {
    const occurrences = buildPatternOccurrences(days, startDate, endDate, durationMinutes, timezone);

    if (occurrences.length === 0) return;

    // Batch-fetch all overlapping instances for the entire occurrence range in one query (via repository)
    const overlappingInstances = await SchedulingRepository.findOverlappingInstancesForRange(
      studentId,
      teacherId,
      occurrences[0]?.start,
      occurrences[occurrences.length - 1]?.end,
      ignoreInstanceIds,
      txParam(tx)
    );

    // Check each occurrence against the pre-fetched overlapping instances in memory
    for (const occ of occurrences) {
      const conflicts = overlappingInstances.filter(
        inst => inst.scheduledStartAt < occ.end && inst.scheduledEndAt > occ.start
      );
      if (conflicts.length > 0) {
        const tErrors = getServerTranslations(locale).errorsTranslations;
        throw new Error(tErrors.invalidInput);
      }
    }

    // Single batched teacher-availability validation for all occurrences (3 DB queries total)
    try {
      await TeacherAvailabilityRepository.validateBookingAvailabilityBatch(
        teacherId,
        occurrences.map(occ => ({ startTime: occ.start, endTime: occ.end })),
        tx as DBTransaction | undefined,
        locale
      );
    } catch {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.invalidInput);
    }
  };

  /**
   * Find available class slots for a student on a given date.
   * Generates candidate slots (default 60-min) throughout the day and checks
   * both teacher availability and class-instance conflicts in batch.
   *
   * @param studentId - The student to find slots for
   * @param date - The date (UTC) to search on
   * @param teacherId - Optional specific teacher; if omitted, returns empty
   * @param durationMinutes - Slot duration (default 60)
   * @param tx - Optional transaction
   * @param locale - Locale for error messages
   */
  export const findAvailableSlots = async (
    studentId: string,
    date: Date,
    teacherId?: string | null,
    durationMinutes = 60,
    tx?: ReadExecutor,
    locale = "en"
  ): Promise<AvailableClassSlotReturnType[]> => {
    if (!teacherId) return [];

    // Build candidate slots from 00:00 to 24:00 UTC on the given date
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const candidates: { startTime: Date; endTime: Date }[] = [];
    const slotMs = durationMinutes * 60 * 1000;
    for (let t = dayStart.getTime(); t + slotMs <= dayEnd.getTime(); t += slotMs) {
      candidates.push({
        startTime: new Date(t),
        endTime: new Date(t + slotMs),
      });
    }

    if (candidates.length === 0) return [];

    // Batch-check teacher availability (returns boolean[] — no throw)
    const teacherAvailable = await TeacherAvailabilityRepository.checkBookingAvailabilityBatch(
      teacherId,
      candidates,
      txParam(tx),
      locale
    );

    // Filter to slots where teacher is available, then check class conflicts
    const result: AvailableClassSlotReturnType[] = [];
    for (let i = 0; i < candidates.length; i++) {
      const slot = candidates[i];
      if (!slot || !teacherAvailable[i]) continue;

      const hasConflict = await SchedulingRepository.hasOverlappingInstance(
        studentId,
        teacherId,
        slot.startTime,
        slot.endTime,
        [],
        txParam(tx)
      );

      result.push({
        teacherId,
        startAt: slot.startTime,
        endAt: slot.endTime,
        available: !hasConflict,
      });
    }

    return result;
  };
}

/**
 * Returns the timezone offset in milliseconds for the given IANA timezone
 * at the given point in time. Positive = ahead of UTC, negative = behind.
 * Uses Intl.DateTimeFormat to avoid depending on a full timezone library.
 */
function getTzOffsetMs(timezone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map = new Map(parts.map(p => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(map.get("year")),
    Number(map.get("month")) - 1,
    Number(map.get("day")),
    Number(map.get("hour")) === 24 ? 0 : Number(map.get("hour")),
    Number(map.get("minute")),
    Number(map.get("second"))
  );
  return asUtc - date.getTime();
}

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const TZ_DAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
 * Builds a list of { start, end } occurrences for each matching day-of-week
 * and start-time within [startDate, endDate], interpreting times in the
 * given timezone.
 */
function buildPatternOccurrences(
  days: { dayOfWeek: string; startTime: string }[],
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  timezone: string
): { start: Date; end: Date }[] {
  const occurrences: { start: Date; end: Date }[] = [];
  const curr = new Date(startDate);

  while (curr <= endDate) {
    const currMs = curr.getTime();
    const tzDay = new Date(currMs).toLocaleString("en-US", { weekday: "short", timeZone: timezone });
    const dayOfWeekNum = TZ_DAY_MAP[tzDay] ?? curr.getUTCDay();

    for (const d of days) {
      const targetDayNum = DAY_MAP[d.dayOfWeek.toUpperCase()];
      if (targetDayNum !== dayOfWeekNum) continue;

      const [hoursStr, minutesStr] = d.startTime.split(":");
      const hours = Number.parseInt(hoursStr ?? "0", 10);
      const minutes = Number.parseInt(minutesStr ?? "0", 10);

      const dateStr = curr.toISOString().split("T")[0];
      const localStr = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
      const slotStart = new Date(localStr + "Z");
      try {
        const offsetMs = getTzOffsetMs(timezone, slotStart);
        slotStart.setTime(slotStart.getTime() - offsetMs);
      } catch {
        // Fallback: treat as UTC (original behavior)
      }

      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
      occurrences.push({ start: slotStart, end: slotEnd });
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return occurrences;
}
