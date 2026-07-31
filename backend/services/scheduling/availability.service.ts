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

export interface AvailableSlot {
  startAt: Date;
  endAt: Date;
  isAvailable: boolean;
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
    tx?: ReadExecutor
  ): Promise<void> => {
    // For each day in pattern within [startDate, endDate], check slot availability
    const occurrences: { start: Date; end: Date }[] = [];
    const curr = new Date(startDate);
    const dayMap: Record<string, number> = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    while (curr <= endDate) {
      const dayOfWeekNum = curr.getUTCDay();
      for (const d of days) {
        const targetDayNum = dayMap[d.dayOfWeek.toUpperCase()];
        if (targetDayNum === dayOfWeekNum) {
          const [hoursStr, minutesStr] = d.startTime.split(":");
          const hours = Number.parseInt(hoursStr ?? "0", 10);
          const minutes = Number.parseInt(minutesStr ?? "0", 10);

          const slotStart = new Date(curr);
          slotStart.setUTCHours(hours, minutes, 0, 0);
          const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour default if not specified

          occurrences.push({ start: slotStart, end: slotEnd });
        }
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

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

  export const findAvailableSlots = async (
    studentId: string,
    teacherId: string,
    dateRange: { from: Date; to: Date },
    durationMinutes: number,
    tx?: ReadExecutor,
    locale?: string
  ): Promise<AvailableSlot[]> => {
    const slots: AvailableSlot[] = [];

    // Pre-fetch all overlapping class instances for the entire range in one query
    const q = queryDb(tx);
    const overlappingInstances = await q
      .select({
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
      })
      .from(classInstances)
      .where(
        and(
          isNull(classInstances.deletedAt),
          sql`${classInstances.scheduledStartAt} < ${dateRange.to}`,
          sql`${classInstances.scheduledEndAt} > ${dateRange.from}`,
          sql`(${classInstances.studentId} = ${studentId} OR ${classInstances.teacherId} = ${teacherId})`
        )
      );

    const curr = new Date(dateRange.from);
    const candidateSlots: { startTime: Date; endTime: Date }[] = [];

    while (curr < dateRange.to) {
      const slotEnd = new Date(curr.getTime() + durationMinutes * 60 * 1000);
      if (slotEnd > dateRange.to) break;

      // Check conflict against pre-fetched instances (in-memory)
      const hasConflict = overlappingInstances.some(
        inst => inst.scheduledStartAt < slotEnd && inst.scheduledEndAt > curr
      );

      if (!hasConflict) {
        candidateSlots.push({ startTime: new Date(curr), endTime: slotEnd });
      }

      curr.setTime(curr.getTime() + 30 * 60 * 1000); // 30-minute steps
    }

    // Batch-validate teacher availability for all candidate slots in a single DB round-trip
    const availableSet = new Set<string>();
    if (candidateSlots.length > 0) {
      const batchResults = await TeacherAvailabilityRepository.checkBookingAvailabilityBatch(
        teacherId,
        candidateSlots,
        tx as DBTransaction | undefined,
        locale ?? "en"
      );
      for (let i = 0; i < candidateSlots.length; i++) {
        if (batchResults[i]) {
          availableSet.add(`${candidateSlots[i]?.startTime.getTime()}`);
        }
      }
    }

    // Build final slots list interleaving available and unavailable candidates
    for (const candidate of candidateSlots) {
      slots.push({
        startAt: candidate.startTime,
        endAt: candidate.endTime,
        isAvailable: availableSet.has(`${candidate.startTime.getTime()}`),
      });
    }

    return slots;
  };
}
