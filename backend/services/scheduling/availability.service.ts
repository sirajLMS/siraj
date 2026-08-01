import { and, isNull, notInArray, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import type { db } from "@/backend/db/drizzleDb";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teachers/teacher-availability.repository";
import { classInstances } from "@/backend/db/schema";
import { getServerTranslations } from "@/shared/locale";

type ReadExecutor = DBTransaction | typeof db;

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
    const q = queryDb(tx);

    const conditions = [
      isNull(classInstances.deletedAt),
      sql`${classInstances.scheduledStartAt} < ${endAt}`,
      sql`${classInstances.scheduledEndAt} > ${startAt}`,
      sql`(${classInstances.studentId} = ${studentId} OR ${classInstances.teacherId} = ${teacherId})`,
    ];

    if (ignoreInstanceIds.length > 0) {
      conditions.push(notInArray(classInstances.id, ignoreInstanceIds));
    }

    const conflicts = await q
      .select({ id: classInstances.id })
      .from(classInstances)
      .where(and(...conditions))
      .limit(1);

    if (conflicts.length > 0) return false;

    // Check teacher availability windows, unavailability, and vacations
    try {
      await TeacherAvailabilityRepository.validateBookingAvailability(
        teacherId,
        startAt,
        endAt,
        tx as DBTransaction | undefined,
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

    // Batch-fetch all overlapping instances for the entire occurrence range in one query
    const q = queryDb(tx);
    const conditions = [
      isNull(classInstances.deletedAt),
      sql`${classInstances.scheduledStartAt} < ${occurrences[occurrences.length - 1]?.end}`,
      sql`${classInstances.scheduledEndAt} > ${occurrences[0]?.start}`,
      sql`(${classInstances.studentId} = ${studentId} OR ${classInstances.teacherId} = ${teacherId})`,
    ];
    if (ignoreInstanceIds.length > 0) {
      conditions.push(notInArray(classInstances.id, ignoreInstanceIds));
    }

    const overlappingInstances = await q
      .select({
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
      })
      .from(classInstances)
      .where(and(...conditions));

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
