import { and, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  teacherAvailabilityWindows,
  teacherRecurringUnavailability,
  teachers,
  teacherVacationRequests,
  users,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";
import { DayOfWeek, VacationRequestStatus } from "@/shared/lib/enum";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type TeacherGender = string | null;

interface TeacherShortInfo {
  teacherId: string;
  teacherName: string | null;
  teacherGender: TeacherGender;
  teacherTimezone: string;
}

const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function dateToTimeString(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function getUtcDayOfWeek(date: Date): DayOfWeek {
  return JS_DAY_TO_ENUM[date.getUTCDay()];
}

function getUtcDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isWithinEffectiveRange(
  bookingDate: string,
  effectiveFrom: string | null,
  effectiveUntil: string | null
): boolean {
  if (effectiveFrom && bookingDate < effectiveFrom) {
    return false;
  }
  if (effectiveUntil && bookingDate > effectiveUntil) {
    return false;
  }
  return true;
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

function getBlockedRanges(
  dayUnavail: Types.TeacherRecurringUnavailabilitySelectType[],
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
  const sorted = [...blockedRanges].sort((a, b) => a.start - b.start);
  const mergedBlocked: { start: number; end: number }[] = [];
  for (const range of sorted) {
    if (mergedBlocked.length > 0 && range.start <= mergedBlocked[mergedBlocked.length - 1].end) {
      mergedBlocked[mergedBlocked.length - 1].end = Math.max(mergedBlocked[mergedBlocked.length - 1].end, range.end);
    } else {
      mergedBlocked.push({ ...range });
    }
  }
  return mergedBlocked;
}

function createGap(
  teacher: TeacherShortInfo,
  day: DayOfWeek,
  startMinutes: number,
  endMinutes: number
): Types.TeacherAvailabilityGap {
  const startHoursStr = String(Math.floor(startMinutes / 60)).padStart(2, "0");
  const startMinutesStr = String(startMinutes % 60).padStart(2, "0");
  const endHoursStr = String(Math.floor(endMinutes / 60)).padStart(2, "0");
  const endMinutesStr = String(endMinutes % 60).padStart(2, "0");

  return {
    id: `${teacher.teacherId}-${day}-${startMinutes}-${endMinutes}`,
    teacherId: teacher.teacherId,
    teacherName: teacher.teacherName ?? "Unknown",
    teacherGender: teacher.teacherGender,
    dayOfWeek: day,
    gapStartTime: `${startHoursStr}:${startMinutesStr}`,
    gapEndTime: `${endHoursStr}:${endMinutesStr}`,
    timezone: teacher.teacherTimezone,
  };
}

function generateGapsFromBlocked(
  teacher: TeacherShortInfo,
  day: DayOfWeek,
  searchStart: number,
  searchEnd: number,
  mergedBlocked: { start: number; end: number }[]
): Types.TeacherAvailabilityGap[] {
  const gaps: Types.TeacherAvailabilityGap[] = [];
  let cursor = searchStart;
  for (const blocked of mergedBlocked) {
    if (cursor < blocked.start) {
      gaps.push(createGap(teacher, day, cursor, blocked.start));
    }
    cursor = Math.max(cursor, blocked.end);
  }
  if (cursor < searchEnd) {
    gaps.push(createGap(teacher, day, cursor, searchEnd));
  }
  return gaps;
}

function findGapsForWindow(
  teacher: TeacherShortInfo,
  day: DayOfWeek,
  window: Types.TeacherAvailabilityWindowSelectType,
  dayUnavail: Types.TeacherRecurringUnavailabilitySelectType[],
  fromMinutes: number,
  toMinutes: number
): Types.TeacherAvailabilityGap[] {
  const windowStart = timeToMinutes(window.startTime);
  const windowEnd = timeToMinutes(window.endTime);

  const searchStart = Math.max(windowStart, fromMinutes);
  const searchEnd = Math.min(windowEnd, toMinutes);

  if (searchStart >= searchEnd) return [];

  const blockedRanges = getBlockedRanges(dayUnavail, searchStart, searchEnd);
  const mergedBlocked = mergeBlockedRanges(blockedRanges);

  return generateGapsFromBlocked(teacher, day, searchStart, searchEnd, mergedBlocked);
}

function findGapsForDay(
  teacher: TeacherShortInfo,
  day: DayOfWeek,
  dayWindows: Types.TeacherAvailabilityWindowSelectType[],
  dayUnavail: Types.TeacherRecurringUnavailabilitySelectType[],
  fromMinutes: number,
  toMinutes: number
): Types.TeacherAvailabilityGap[] {
  const gaps: Types.TeacherAvailabilityGap[] = [];
  for (const window of dayWindows) {
    const windowGaps = findGapsForWindow(teacher, day, window, dayUnavail, fromMinutes, toMinutes);
    gaps.push(...windowGaps);
  }
  return gaps;
}

function findGapsForTeacher(
  teacher: TeacherShortInfo,
  daysOfWeek: DayOfWeek[],
  windows: Types.TeacherAvailabilityWindowSelectType[],
  unavailabilities: Types.TeacherRecurringUnavailabilitySelectType[],
  fromMinutes: number,
  toMinutes: number
): Types.TeacherAvailabilityGap[] {
  const gaps: Types.TeacherAvailabilityGap[] = [];
  for (const day of daysOfWeek) {
    const dayWindows = windows.filter(w => (w.dayOfWeek as DayOfWeek) === day);
    const dayUnavail = unavailabilities.filter(u => (u.dayOfWeek as DayOfWeek) === day);
    const dayGaps = findGapsForDay(teacher, day, dayWindows, dayUnavail, fromMinutes, toMinutes);
    gaps.push(...dayGaps);
  }
  return gaps;
}

export namespace TeacherAvailabilityRepository {
  async function acquireAvailabilityLock(tx: DBTransaction, teacherId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('teacher_availability_' || ${teacherId}::text))`);
  }

  async function assertValidTimeRange(startTime: string, endTime: string, locale?: string): Promise<void> {
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("startTimeBeforeEndTime"));
    }
  }

  export const addAvailabilityWindow = async (
    input: Types.AvailabilityWindowInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherAvailabilityWindowSelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireAvailabilityLock(t, input.teacherId);
      await assertValidTimeRange(input.startTime, input.endTime, locale);
      const now = new Date();

      const [created] = await t
        .insert(teacherAvailabilityWindows)
        .values({
          teacherId: input.teacherId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          timezoneId: input.timezoneId ?? null,
          timezone: input.timezone,
          utcOffsetSnapshot: input.utcOffsetSnapshot ?? null,
          effectiveFrom: input.effectiveFrom ?? null,
          effectiveUntil: input.effectiveUntil ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const addRecurringUnavailability = async (
    input: Types.RecurringUnavailabilityInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherRecurringUnavailabilitySelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireAvailabilityLock(t, input.teacherId);
      await assertValidTimeRange(input.startTime, input.endTime, locale);
      const now = new Date();

      const [created] = await t
        .insert(teacherRecurringUnavailability)
        .values({
          teacherId: input.teacherId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          timezoneId: input.timezoneId ?? null,
          timezone: input.timezone,
          utcOffsetSnapshot: input.utcOffsetSnapshot ?? null,
          effectiveFrom: input.effectiveFrom ?? null,
          effectiveUntil: input.effectiveUntil ?? null,
          reason: input.reason ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const submitVacationRequest = async (
    input: Types.SubmitVacationRequestInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    const runner = async (t: DBTransaction) => {
      if (input.startAt >= input.endAt) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("vacationStartBeforeEnd"));
      }

      await acquireAvailabilityLock(t, input.teacherId);
      const now = new Date();

      const [created] = await t
        .insert(teacherVacationRequests)
        .values({
          teacherId: input.teacherId,
          requestedByUserId: input.requestedByUserId,
          startAt: input.startAt,
          endAt: input.endAt,
          timezoneId: input.timezoneId ?? null,
          timezone: input.timezone,
          utcOffsetSnapshot: input.utcOffsetSnapshot ?? null,
          reason: input.reason ?? null,
          status: VacationRequestStatus.PENDING,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const approveVacationRequest = async (
    input: Types.ProcessVacationRequestInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    return processVacationRequest(input, VacationRequestStatus.APPROVED, tx, locale);
  };

  export const rejectVacationRequest = async (
    input: Types.ProcessVacationRequestInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    return processVacationRequest(input, VacationRequestStatus.REJECTED, tx, locale);
  };

  async function processVacationRequest(
    input: Types.ProcessVacationRequestInput,
    status: VacationRequestStatus.APPROVED | VacationRequestStatus.REJECTED,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> {
    const runner = async (t: DBTransaction) => {
      const results = await t
        .select()
        .from(teacherVacationRequests)
        .where(eq(teacherVacationRequests.id, input.vacationRequestId))
        .limit(1);

      if (results.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("vacationRequestNotFound", { id: input.vacationRequestId }));
      }

      const current = results[0];
      await acquireAvailabilityLock(t, current.teacherId);

      if ((current.status as VacationRequestStatus) !== VacationRequestStatus.PENDING) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("vacationRequestNotPending", { id: input.vacationRequestId }));
      }

      const now = new Date();
      const [updated] = await t
        .update(teacherVacationRequests)
        .set({
          status,
          processedAt: now,
          processedByUserId: input.processedByUserId,
          updatedAt: now,
        })
        .where(eq(teacherVacationRequests.id, input.vacationRequestId))
        .returning();

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  }

  export const cancelVacationRequest = async (
    vacationRequestId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    const runner = async (t: DBTransaction) => {
      const results = await t
        .select()
        .from(teacherVacationRequests)
        .where(eq(teacherVacationRequests.id, vacationRequestId))
        .limit(1);

      if (results.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("vacationRequestNotFound", { id: vacationRequestId }));
      }

      const current = results[0];
      await acquireAvailabilityLock(t, current.teacherId);

      if ((current.status as VacationRequestStatus) === VacationRequestStatus.CANCELLED) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("vacationRequestAlreadyCancelled", { id: vacationRequestId }));
      }

      const now = new Date();
      const [updated] = await t
        .update(teacherVacationRequests)
        .set({
          status: VacationRequestStatus.CANCELLED,
          updatedAt: now,
        })
        .where(eq(teacherVacationRequests.id, vacationRequestId))
        .returning();

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  /**
   * Input for booking availability validation
   */
  export interface BookingAvailabilityInput {
    teacherId: string;
    startTime: Date;
    endTime: Date;
  }

  /**
   * Checks for approved vacations that overlap with the booking time
   */
  async function checkVacationConflicts(
    t: DBTransaction | typeof db,
    input: BookingAvailabilityInput,
    locale?: string
  ): Promise<void> {
    const approvedVacations = await t
      .select({ id: teacherVacationRequests.id })
      .from(teacherVacationRequests)
      .where(
        and(
          eq(teacherVacationRequests.teacherId, input.teacherId),
          eq(teacherVacationRequests.status, VacationRequestStatus.APPROVED),
          sql`(${teacherVacationRequests.startAt}, ${teacherVacationRequests.endAt}) OVERLAPS (${input.startTime}, ${input.endTime})`
        )
      )
      .limit(1);

    if (approvedVacations.length > 0) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("teacherOnVacation"));
    }
  }

  /**
   * Checks for recurring unavailability patterns that overlap with the booking time
   */
  async function checkRecurringUnavailability(
    t: DBTransaction | typeof db,
    input: BookingAvailabilityInput,
    bookingDate: string,
    bookingDay: DayOfWeek,
    bookingStartMinutes: number,
    bookingEndMinutes: number,
    locale?: string
  ): Promise<void> {
    const patterns = await t
      .select()
      .from(teacherRecurringUnavailability)
      .where(
        and(
          eq(teacherRecurringUnavailability.teacherId, input.teacherId),
          eq(teacherRecurringUnavailability.dayOfWeek, bookingDay)
        )
      );

    for (const pattern of patterns) {
      if (!isWithinEffectiveRange(bookingDate, pattern.effectiveFrom, pattern.effectiveUntil)) {
        continue;
      }

      if (
        timesOverlap(
          bookingStartMinutes,
          bookingEndMinutes,
          timeToMinutes(pattern.startTime),
          timeToMinutes(pattern.endTime)
        )
      ) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("teacherUnavailabilityConflict"));
      }
    }
  }

  /**
   * Validates if the requested time falls within teacher availability windows
   */
  async function validateAvailabilityWindows(
    t: DBTransaction | typeof db,
    input: BookingAvailabilityInput,
    bookingDate: string,
    bookingDay: DayOfWeek,
    bookingStartMinutes: number,
    bookingEndMinutes: number,
    locale?: string
  ): Promise<void> {
    const windows = await t
      .select()
      .from(teacherAvailabilityWindows)
      .where(eq(teacherAvailabilityWindows.teacherId, input.teacherId));

    if (windows.length === 0) return;

    const matches = windows.some(window => {
      if ((window.dayOfWeek as DayOfWeek) !== bookingDay) return false;
      if (!isWithinEffectiveRange(bookingDate, window.effectiveFrom, window.effectiveUntil)) return false;
      return isWithinTimeWindow(
        bookingStartMinutes,
        bookingEndMinutes,
        timeToMinutes(window.startTime),
        timeToMinutes(window.endTime)
      );
    });

    if (!matches) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("outsideAvailability"));
    }
  }

  /**
   * Comprehensive validation of a teacher's availability for a specific booking
   */
  export const validateBookingAvailability = async (
    teacherId: string,
    startTime: Date,
    endTime: Date,
    tx?: DBTransaction,
    locale?: string
  ): Promise<void> => {
    const t = tx ?? db;
    const input: BookingAvailabilityInput = { teacherId, startTime, endTime };
    const bookingDate = getUtcDateString(startTime);
    const bookingDay = getUtcDayOfWeek(startTime);
    const bookingStartMinutes = timeToMinutes(dateToTimeString(startTime));
    const bookingEndMinutes = timeToMinutes(dateToTimeString(endTime));

    await checkVacationConflicts(t, input, locale);
    await checkRecurringUnavailability(
      t,
      input,
      bookingDate,
      bookingDay,
      bookingStartMinutes,
      bookingEndMinutes,
      locale
    );
    await validateAvailabilityWindows(
      t,
      input,
      bookingDate,
      bookingDay,
      bookingStartMinutes,
      bookingEndMinutes,
      locale
    );
  };

  export const searchCrossStaffAvailability = async (
    input: Types.CrossStaffSearchInput,
    tx?: DBTransaction
  ): Promise<Types.AvailabilitySearchResult> => {
    const t = tx ?? db;

    const fromMinutes = timeToMinutes(input.fromTime);
    const toMinutes = timeToMinutes(input.toTime);

    if (fromMinutes >= toMinutes) {
      const tFunc = await getBackendTranslations({ locale: undefined, namespace: "errors" });
      throw new Error(tFunc("startTimeBeforeEndTime"));
    }

    const teacherConditions = [eq(teachers.status, "ACTIVATED")];
    if (input.gender) {
      teacherConditions.push(eq(teachers.gender, input.gender));
    }

    const allTeachers = await t
      .select({
        teacherId: teachers.id,
        teacherName: users.name,
        teacherGender: teachers.gender,
        teacherTimezone: teachers.timezone,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(and(...teacherConditions));

    if (allTeachers.length === 0) {
      return {
        id: `availability-search-${input.fromTime}-${input.toTime}`,
        teachers: [],
        totalGaps: 0,
      };
    }

    const daysOfWeek = Object.values(DayOfWeek);
    const result: Types.AvailabilitySearchResult["teachers"] = [];
    let totalGaps = 0;

    for (const teacher of allTeachers) {
      const windows = await t
        .select()
        .from(teacherAvailabilityWindows)
        .where(eq(teacherAvailabilityWindows.teacherId, teacher.teacherId));

      const unavailabilities = await t
        .select()
        .from(teacherRecurringUnavailability)
        .where(eq(teacherRecurringUnavailability.teacherId, teacher.teacherId));

      const gaps = findGapsForTeacher(teacher, daysOfWeek, windows, unavailabilities, fromMinutes, toMinutes);

      if (gaps.length > 0) {
        result.push({
          id: teacher.teacherId,
          name: teacher.teacherName ?? "Unknown",
          gender: teacher.teacherGender,
          timezone: teacher.teacherTimezone,
          gaps,
        });
        totalGaps += gaps.length;
      }
    }

    return {
      id: `availability-search-${input.fromTime}-${input.toTime}`,
      teachers: result,
      totalGaps,
    };
  };
}
