import { and, eq, gte, ilike, inArray, isNull, lte, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import {
  classInstances,
  teacherAvailabilityWindows,
  teacherRecurringUnavailability,
  teachers,
  teacherVacationRequests,
  users,
} from "@/backend/db/schema";
import { AvailabilitySearchSortBy, DayOfWeek, type Gender, VacationRequestStatus } from "@/backend/enum";
import { NotFoundError, ValidationError } from "@/backend/lib/errors";
import type * as Types from "@/backend/types";
import { PaginationArgs } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import { PaginationUtils } from "@/backend/utils/pagination.utils";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { parseDayOfWeek, parseGender, parseIanaTimezone } from "@/shared/lib/enum";
import { getServerTranslations } from "@/shared/locale";

type TeacherGender = string | null;

function dayOfWeekEquals(value: string, day: DayOfWeek): boolean {
  return parseDayOfWeek(value) === parseDayOfWeek(day);
}

function isVacationRequestStatus(value: unknown): value is VacationRequestStatus {
  return (
    value === VacationRequestStatus.PENDING ||
    value === VacationRequestStatus.APPROVED ||
    value === VacationRequestStatus.REJECTED ||
    value === VacationRequestStatus.CANCELLED
  );
}

interface TeacherShortInfo {
  teacherId: string;
  teacherName: string | null;
  teacherGender: TeacherGender;
  teacherTimezone: IanaTimezone;
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

/** Pure vacation overlap check — shared by DB-querying and in-memory paths */
function checkVacationOverlap(startTime: Date, endTime: Date, vacations: { startAt: Date; endAt: Date }[]): boolean {
  return vacations.some(v => v.startAt < endTime && v.endAt > startTime);
}

/** Pure unavailability pattern check — shared by DB-querying and in-memory paths */
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

/** Pure availability window check — shared by DB-querying and in-memory paths */
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
): Types.TeacherAvailabilityGap {
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
): Types.TeacherAvailabilityGap[] {
  const gaps: Types.TeacherAvailabilityGap[] = [];
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

function expandDateRange(fromDate: string, toDate: string): string[] {
  const dates: string[] = [];
  let currentMs = Date.parse(`${fromDate}T00:00:00.000Z`);
  const endMs = Date.parse(`${toDate}T00:00:00.000Z`);
  while (currentMs <= endMs) {
    dates.push(getUtcDateString(new Date(currentMs)));
    currentMs += 24 * 60 * 60 * 1000;
  }
  return dates;
}

function getDayOfWeekFromDateString(dateStr: string): DayOfWeek {
  return getUtcDayOfWeek(new Date(`${dateStr}T00:00:00.000Z`));
}

function getVacationBlockedRangesForDate(
  calendarDate: string,
  vacations: { startAt: Date; endAt: Date }[]
): { start: number; end: number }[] {
  const dayStart = new Date(`${calendarDate}T00:00:00.000Z`);
  const dayEnd = new Date(`${calendarDate}T23:59:59.999Z`);
  const blocked: { start: number; end: number }[] = [];

  for (const vacation of vacations) {
    if (vacation.endAt <= dayStart || vacation.startAt > dayEnd) {
      continue;
    }

    const blockStart = vacation.startAt > dayStart ? timeToMinutes(dateToTimeString(vacation.startAt)) : 0;
    const blockEnd = vacation.endAt < dayEnd ? timeToMinutes(dateToTimeString(vacation.endAt)) : 24 * 60;

    if (blockStart < blockEnd) {
      blocked.push({ start: blockStart, end: blockEnd });
    }
  }

  return blocked;
}

function getBookingBlockedRangesForDate(
  calendarDate: string,
  bookings: { scheduledStartAt: Date; scheduledEndAt: Date }[]
): { start: number; end: number }[] {
  const blocked: { start: number; end: number }[] = [];

  for (const booking of bookings) {
    const bookingDate = getUtcDateString(booking.scheduledStartAt);
    if (bookingDate !== calendarDate) {
      continue;
    }

    blocked.push({
      start: timeToMinutes(dateToTimeString(booking.scheduledStartAt)),
      end: timeToMinutes(dateToTimeString(booking.scheduledEndAt)),
    });
  }

  return blocked;
}

interface MinuteRange {
  from: number;
  to: number;
}

interface FindGapsForCalendarDateOptions {
  teacher: TeacherShortInfo;
  calendarDate: string;
  day: DayOfWeek;
  dayWindows: Types.TeacherAvailabilityWindowSelectType[];
  dayUnavail: Types.TeacherRecurringUnavailabilitySelectType[];
  extraBlocked: { start: number; end: number }[];
  searchRange: MinuteRange;
}

function findGapsForCalendarDate(options: FindGapsForCalendarDateOptions): Types.TeacherAvailabilityGap[] {
  const { teacher, calendarDate, day, dayWindows, dayUnavail, extraBlocked, searchRange } = options;
  const { from: fromMinutes, to: toMinutes } = searchRange;
  const gaps: Types.TeacherAvailabilityGap[] = [];
  const effectiveWindows = dayWindows.filter(window =>
    isWithinEffectiveRange(calendarDate, window.effectiveFrom, window.effectiveUntil)
  );

  for (const window of effectiveWindows) {
    const windowStart = timeToMinutes(window.startTime);
    const windowEnd = timeToMinutes(window.endTime);
    const searchStart = Math.max(windowStart, fromMinutes);
    const searchEnd = Math.min(windowEnd, toMinutes);

    if (searchStart >= searchEnd) {
      continue;
    }

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

function countAvailableDays(gaps: Types.TeacherAvailabilityGap[]): number {
  return new Set(gaps.map(gap => gap.calendarDate)).size;
}

function sortTeachers(
  teacherResults: Types.AvailabilitySearchTeacher[],
  sortBy: AvailabilitySearchSortBy | null | undefined
): Types.AvailabilitySearchTeacher[] {
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

export namespace TeacherAvailabilityRepository {
  async function acquireAvailabilityLock(tx: DBTransaction, teacherId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('teacher_availability_' || ${teacherId}::text))`);
  }

  async function assertValidTimeRange(startTime: string, endTime: string, locale?: string): Promise<void> {
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(`${errorsTranslations.invalidInput}; Start time must be before end time`);
    }
  }

  function buildCommonWindowValues(teacherId: string, input: Types.AvailabilityWindowInput) {
    const now = new Date();
    return {
      teacherId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      timezone: input.timezone,
      utcOffsetSnapshot: input.utcOffsetSnapshot ?? null,
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveUntil: input.effectiveUntil ?? null,
      createdAt: now,
      updatedAt: now,
    };
  }

  function withTransaction<T>(runner: (t: DBTransaction) => Promise<T>, tx?: DBTransaction): Promise<T> {
    return tx ? runner(tx) : db.transaction(runner);
  }

  async function withAvailabilityLock<T>(
    teacherId: string,
    startTime: string,
    endTime: string,
    create: (t: DBTransaction) => Promise<T>,
    tx?: DBTransaction,
    locale?: string
  ): Promise<T> {
    const runner = async (t: DBTransaction) => {
      await acquireAvailabilityLock(t, teacherId);
      await assertValidTimeRange(startTime, endTime, locale);
      return create(t);
    };
    return withTransaction(runner, tx);
  }

  export const addAvailabilityWindow = async (
    teacherId: string,
    input: Types.AvailabilityWindowInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherAvailabilityWindowSelectType> => {
    return withAvailabilityLock(
      teacherId,
      input.startTime,
      input.endTime,
      async t => {
        const [created] = await t
          .insert(teacherAvailabilityWindows)
          .values(buildCommonWindowValues(teacherId, input))
          .returning();
        return created;
      },
      tx,
      locale
    );
  };

  export const addRecurringUnavailability = async (
    teacherId: string,
    input: Types.RecurringUnavailabilityInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherRecurringUnavailabilitySelectType> => {
    return withAvailabilityLock(
      teacherId,
      input.startTime,
      input.endTime,
      async t => {
        const [created] = await t
          .insert(teacherRecurringUnavailability)
          .values({
            ...buildCommonWindowValues(teacherId, input),
            reason: input.reason ?? null,
          })
          .returning();
        return created;
      },
      tx,
      locale
    );
  };

  export const submitVacationRequest = async (
    input: Types.SubmitVacationRequestInput,
    requestedByUserId: string,
    teacherId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    const runner = async (t: DBTransaction) => {
      if (input.startAt >= input.endAt) {
        const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new ValidationError(`${errorsTranslations.invalidInput}; Vacation start date must be before end date`);
      }

      await acquireAvailabilityLock(t, teacherId);
      const now = new Date();

      const [created] = await t
        .insert(teacherVacationRequests)
        .values({
          teacherId,
          requestedByUserId,
          startAt: input.startAt,
          endAt: input.endAt,
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

    return withTransaction(runner, tx);
  };

  export const approveVacationRequest = async (
    input: Types.ProcessVacationRequestInput,
    processedByUserId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    return processVacationRequest(input, VacationRequestStatus.APPROVED, processedByUserId, tx, locale);
  };

  export const rejectVacationRequest = async (
    input: Types.ProcessVacationRequestInput,
    processedByUserId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    return processVacationRequest(input, VacationRequestStatus.REJECTED, processedByUserId, tx, locale);
  };

  async function fetchVacationRequest(
    t: DBTransaction,
    vacationRequestId: string
  ): Promise<Types.TeacherVacationRequestSelectType> {
    const results = await t
      .select()
      .from(teacherVacationRequests)
      .where(eq(teacherVacationRequests.id, vacationRequestId))
      .limit(1);

    if (results.length === 0) {
      throw new NotFoundError("VACATION_REQUEST", `Vacation request ${vacationRequestId} not found`);
    }

    return results[0];
  }

  async function assertVacationStatus(
    current: Types.TeacherVacationRequestSelectType,
    shouldFail: (status: VacationRequestStatus) => boolean,
    errorKey: "vacationRequestNotPending" | "vacationRequestAlreadyCancelled",
    vacationRequestId: string,
    locale?: string
  ): Promise<void> {
    if (!isVacationRequestStatus(current.status) || shouldFail(current.status)) {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(
        errorKey === "vacationRequestNotPending"
          ? `Vacation request ${vacationRequestId} is not in pending status. ${errorsTranslations.invalidInput}`
          : `Vacation request ${vacationRequestId} is already cancelled. ${errorsTranslations.invalidInput}`
      );
    }
  }

  async function processVacationRequest(
    input: Types.ProcessVacationRequestInput,
    status: VacationRequestStatus.APPROVED | VacationRequestStatus.REJECTED,
    processedByUserId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> {
    const runner = async (t: DBTransaction) => {
      const current = await fetchVacationRequest(t, input.vacationRequestId);
      await acquireAvailabilityLock(t, current.teacherId);
      await assertVacationStatus(
        current,
        s => s !== VacationRequestStatus.PENDING,
        "vacationRequestNotPending",
        input.vacationRequestId,
        locale
      );

      const now = new Date();
      const [updated] = await t
        .update(teacherVacationRequests)
        .set({
          status,
          processedAt: now,
          processedByUserId,
          updatedAt: now,
        })
        .where(eq(teacherVacationRequests.id, input.vacationRequestId))
        .returning();

      return updated;
    };

    return withTransaction(runner, tx);
  }

  export const cancelVacationRequest = async (
    vacationRequestId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    const runner = async (t: DBTransaction) => {
      const current = await fetchVacationRequest(t, vacationRequestId);
      await acquireAvailabilityLock(t, current.teacherId);
      await assertVacationStatus(
        current,
        s => s === VacationRequestStatus.CANCELLED,
        "vacationRequestAlreadyCancelled",
        vacationRequestId,
        locale
      );

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

    return withTransaction(runner, tx);
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
      const { teacherOnVacation } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(teacherOnVacation);
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

    if (checkUnavailabilityConflict(bookingDate, bookingDay, bookingStartMinutes, bookingEndMinutes, patterns)) {
      const { teacherUnavailabilityConflict } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(teacherUnavailabilityConflict);
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

    if (!checkWindowsMatch(bookingDate, bookingDay, bookingStartMinutes, bookingEndMinutes, windows)) {
      const { outsideAvailability } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(outsideAvailability);
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

  /**
   * In-memory per-slot availability check using pre-fetched rows.
   * Throws the first conflict error encountered (same errors as per-slot variant).
   */
  const validateSlotInMemory = (
    slot: { startTime: Date; endTime: Date },
    vacationsRows: { startAt: Date; endAt: Date }[],
    unavailabilityRows: (typeof teacherRecurringUnavailability.$inferSelect)[],
    windowRows: (typeof teacherAvailabilityWindows.$inferSelect)[],
    locale?: string
  ): void => {
    const bookingDate = getUtcDateString(slot.startTime);
    const bookingDay = getUtcDayOfWeek(slot.startTime);
    const bookingStartMinutes = timeToMinutes(dateToTimeString(slot.startTime));
    const bookingEndMinutes = timeToMinutes(dateToTimeString(slot.endTime));

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
  };

  type BatchAvailabilityRows = [
    { startAt: Date; endAt: Date }[],
    (typeof teacherRecurringUnavailability.$inferSelect)[],
    (typeof teacherAvailabilityWindows.$inferSelect)[],
  ];

  function computeSlotBounds(slots: { startTime: Date; endTime: Date }[]): { earliestStart: Date; latestEnd: Date } {
    const earliestStart = new Date(Math.min(...slots.map(s => s.startTime.getTime())));
    const latestEnd = new Date(Math.max(...slots.map(s => s.endTime.getTime())));
    return { earliestStart, latestEnd };
  }

  async function fetchBatchAvailabilityRows(
    t: DBTransaction | typeof db,
    teacherId: string,
    earliestStart: Date,
    latestEnd: Date
  ): Promise<BatchAvailabilityRows> {
    return Promise.all([
      t
        .select({ startAt: teacherVacationRequests.startAt, endAt: teacherVacationRequests.endAt })
        .from(teacherVacationRequests)
        .where(
          and(
            eq(teacherVacationRequests.teacherId, teacherId),
            eq(teacherVacationRequests.status, VacationRequestStatus.APPROVED),
            sql`(${teacherVacationRequests.startAt}, ${teacherVacationRequests.endAt}) OVERLAPS (${earliestStart}, ${latestEnd})`
          )
        ),
      t.select().from(teacherRecurringUnavailability).where(eq(teacherRecurringUnavailability.teacherId, teacherId)),
      t.select().from(teacherAvailabilityWindows).where(eq(teacherAvailabilityWindows.teacherId, teacherId)),
    ]);
  }

  /**
   * Batched validation of a teacher's availability for multiple occurrences.
   *
   * Fetches vacations, recurring unavailability, and availability windows for the
   * teacher in 3 queries total (regardless of how many occurrences), then validates
   * each occurrence in-memory. Equivalent to calling validateBookingAvailability N
   * times but with O(1) DB round-trips instead of O(N).
   *
   * @throws the first conflict error encountered (same error messages as the per-slot variant).
   */
  export const validateBookingAvailabilityBatch = async (
    teacherId: string,
    slots: { startTime: Date; endTime: Date }[],
    tx?: DBTransaction,
    locale?: string
  ): Promise<void> => {
    if (slots.length === 0) return;
    const t = tx ?? db;

    const { earliestStart, latestEnd } = computeSlotBounds(slots);
    const [vacationsRows, unavailabilityRows, windowRows] = await fetchBatchAvailabilityRows(
      t,
      teacherId,
      earliestStart,
      latestEnd
    );

    for (const slot of slots) {
      validateSlotInMemory(slot, vacationsRows, unavailabilityRows, windowRows, locale);
    }
  };

  /**
   * Non-throwing batched availability check. Returns a boolean[] (same order as `slots`)
   * where `true` means the slot is available and `false` means it conflicts with a
   * vacation, recurring unavailability, or falls outside defined availability windows.
   *
   * Uses the same 3-query batch as {@link validateBookingAvailabilityBatch}, but
   * catches per-slot validation errors instead of throwing on the first conflict.
   * Ideal for `findAvailableSlots` where you need per-slot results, not all-or-nothing.
   */
  export const checkBookingAvailabilityBatch = async (
    teacherId: string,
    slots: { startTime: Date; endTime: Date }[],
    tx?: DBTransaction,
    locale?: string
  ): Promise<boolean[]> => {
    if (slots.length === 0) return [];
    const t = tx ?? db;

    const { earliestStart, latestEnd } = computeSlotBounds(slots);
    const [vacationsRows, unavailabilityRows, windowRows] = await fetchBatchAvailabilityRows(
      t,
      teacherId,
      earliestStart,
      latestEnd
    );

    return slots.map(slot => {
      try {
        validateSlotInMemory(slot, vacationsRows, unavailabilityRows, windowRows, locale);
        return true;
      } catch {
        return false;
      }
    });
  };

  function buildTeacherQueryConditions(gender: Gender | null | undefined, teacherNameSearch?: string | null) {
    const conditions = [eq(users.status, "ACTIVATED")];
    if (gender) {
      conditions.push(eq(teachers.gender, gender));
    }
    if (teacherNameSearch?.trim()) {
      const escapedSearch = escapeLikeWildcards(teacherNameSearch.trim());
      conditions.push(ilike(users.name, `%${escapedSearch}%`));
    }
    return conditions;
  }

  async function fetchAllActiveTeachers(
    t: DBTransaction | typeof db,
    gender: Gender | null | undefined,
    teacherNameSearch?: string | null
  ): Promise<TeacherShortInfo[]> {
    return t
      .select({
        teacherId: teachers.id,
        teacherName: users.name,
        teacherGender: teachers.gender,
        teacherTimezone: users.timezone,
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(...buildTeacherQueryConditions(gender, teacherNameSearch)))
      .orderBy(users.name)
      .then(rows =>
        rows.map(row => ({
          ...row,
          teacherTimezone: parseIanaTimezone(row.teacherTimezone),
        }))
      );
  }

  function groupByTeacherId<T extends { teacherId: string }>(rows: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>();
    for (const row of rows) {
      const list = grouped.get(row.teacherId) ?? [];
      list.push(row);
      grouped.set(row.teacherId, list);
    }
    return grouped;
  }

  async function fetchTeacherAvailabilityData(t: DBTransaction | typeof db, teacherIds: string[]) {
    const [allWindows, allUnavailabilities] = await Promise.all([
      t.select().from(teacherAvailabilityWindows).where(inArray(teacherAvailabilityWindows.teacherId, teacherIds)),
      t
        .select()
        .from(teacherRecurringUnavailability)
        .where(inArray(teacherRecurringUnavailability.teacherId, teacherIds)),
    ]);

    return {
      windowsByTeacher: groupByTeacherId(allWindows),
      unavailabilitiesByTeacher: groupByTeacherId(allUnavailabilities),
    };
  }

  async function fetchApprovedVacations(
    t: DBTransaction | typeof db,
    teacherIds: string[],
    rangeStart: Date,
    rangeEnd: Date
  ) {
    if (teacherIds.length === 0) {
      return [];
    }

    return t
      .select({
        teacherId: teacherVacationRequests.teacherId,
        startAt: teacherVacationRequests.startAt,
        endAt: teacherVacationRequests.endAt,
      })
      .from(teacherVacationRequests)
      .where(
        and(
          inArray(teacherVacationRequests.teacherId, teacherIds),
          eq(teacherVacationRequests.status, VacationRequestStatus.APPROVED),
          sql`(${teacherVacationRequests.startAt}, ${teacherVacationRequests.endAt}) OVERLAPS (${rangeStart}, ${rangeEnd})`
        )
      );
  }

  async function fetchTeacherBookings(
    t: DBTransaction | typeof db,
    teacherIds: string[],
    rangeStart: Date,
    rangeEnd: Date
  ) {
    if (teacherIds.length === 0) {
      return [];
    }

    return t
      .select({
        teacherId: classInstances.teacherId,
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
      })
      .from(classInstances)
      .where(
        and(
          inArray(classInstances.teacherId, teacherIds),
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, rangeStart),
          lte(classInstances.scheduledStartAt, rangeEnd)
        )
      );
  }

  interface TeacherAvailabilityData {
    windowsByTeacher: Map<string, Types.TeacherAvailabilityWindowSelectType[]>;
    unavailabilitiesByTeacher: Map<string, Types.TeacherRecurringUnavailabilitySelectType[]>;
    vacationsByTeacher: Map<string, { startAt: Date; endAt: Date }[]>;
    bookingsByTeacher: Map<string, { scheduledStartAt: Date; scheduledEndAt: Date }[]>;
  }

  interface DateFilterCriteria {
    calendarDates: string[];
    allowedDays: Set<DayOfWeek> | null;
  }

  interface MinResultCriteria {
    minAvailableDays: number | null | undefined;
    minTotalGaps: number | null | undefined;
  }

  interface BuildTeacherSearchResultsOptions {
    allTeachers: TeacherShortInfo[];
    availabilityData: TeacherAvailabilityData;
    dateFilter: DateFilterCriteria;
    timeRange: MinuteRange;
    minResultCriteria: MinResultCriteria;
  }

  function buildTeacherSearchResults(options: BuildTeacherSearchResultsOptions): Types.AvailabilitySearchTeacher[] {
    const { allTeachers, availabilityData, dateFilter, timeRange, minResultCriteria } = options;
    const { windowsByTeacher, unavailabilitiesByTeacher, vacationsByTeacher, bookingsByTeacher } = availabilityData;
    const { calendarDates, allowedDays } = dateFilter;
    const { minAvailableDays, minTotalGaps } = minResultCriteria;
    const result: Types.AvailabilitySearchTeacher[] = [];

    for (const teacher of allTeachers) {
      const windows = windowsByTeacher.get(teacher.teacherId) ?? [];
      const unavailabilities = unavailabilitiesByTeacher.get(teacher.teacherId) ?? [];
      const vacations = vacationsByTeacher.get(teacher.teacherId) ?? [];
      const bookings = bookingsByTeacher.get(teacher.teacherId) ?? [];
      const gaps: Types.TeacherAvailabilityGap[] = [];

      for (const calendarDate of calendarDates) {
        const day = getDayOfWeekFromDateString(calendarDate);
        if (allowedDays && !allowedDays.has(day)) {
          continue;
        }

        const dayWindows = windows.filter(window => dayOfWeekEquals(window.dayOfWeek, day));
        const dayUnavail = unavailabilities.filter(
          unavailability =>
            dayOfWeekEquals(unavailability.dayOfWeek, day) &&
            isWithinEffectiveRange(calendarDate, unavailability.effectiveFrom, unavailability.effectiveUntil)
        );
        const extraBlocked = [
          ...getVacationBlockedRangesForDate(calendarDate, vacations),
          ...getBookingBlockedRangesForDate(calendarDate, bookings),
        ];

        const dayGaps = findGapsForCalendarDate({
          teacher,
          calendarDate,
          day,
          dayWindows,
          dayUnavail,
          extraBlocked,
          searchRange: timeRange,
        });
        gaps.push(...dayGaps);
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

  interface BuildSearchOptionsParams {
    t: DBTransaction | typeof db;
    input: Types.CrossStaffSearchInput;
    allTeachers: TeacherShortInfo[];
    calendarDates: string[];
    allowedDays: Set<DayOfWeek> | null;
    timeRange: MinuteRange;
    rangeStart: Date;
    rangeEnd: Date;
  }

  async function buildSearchOptions(
    params: BuildSearchOptionsParams
  ): Promise<{ options: Omit<BuildTeacherSearchResultsOptions, "allTeachers"> }> {
    const { t, input, allTeachers, calendarDates, allowedDays, timeRange, rangeStart, rangeEnd } = params;
    const teacherIds = allTeachers.map(teacher => teacher.teacherId);
    const { windowsByTeacher, unavailabilitiesByTeacher } = await fetchTeacherAvailabilityData(t, teacherIds);
    const vacations = await fetchApprovedVacations(t, teacherIds, rangeStart, rangeEnd);
    const bookings = await fetchTeacherBookings(t, teacherIds, rangeStart, rangeEnd);

    const vacationsByTeacher = groupByTeacherId(vacations);
    const bookingsByTeacher = groupByTeacherId(bookings);

    const options: Omit<BuildTeacherSearchResultsOptions, "allTeachers"> = {
      availabilityData: {
        windowsByTeacher,
        unavailabilitiesByTeacher,
        vacationsByTeacher,
        bookingsByTeacher,
      },
      dateFilter: {
        calendarDates,
        allowedDays,
      },
      timeRange,
      minResultCriteria: {
        minAvailableDays: input.minAvailableDays,
        minTotalGaps: input.minTotalGaps,
      },
    };
    return { options };
  }

  export const searchCrossStaffAvailability = async (
    input: Types.CrossStaffSearchInput,
    tx?: DBTransaction
  ): Promise<Types.AvailabilitySearchResult> => {
    const t = tx ?? db;

    const fromMinutes = timeToMinutes(input.fromTime);
    const toMinutes = timeToMinutes(input.toTime);
    const timeRange: MinuteRange = { from: fromMinutes, to: toMinutes };

    if (fromMinutes >= toMinutes) {
      const { invalidInput } = getServerTranslations("en").errorsTranslations;
      throw new ValidationError(`${invalidInput}; Start time must be before end time`);
    }

    const fromDate = input.fromDate ?? getUtcDateString(new Date());
    const toDate = input.toDate ?? getUtcDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    if (fromDate > toDate) {
      const { invalidInput } = getServerTranslations("en").errorsTranslations;
      throw new ValidationError(`${invalidInput}; Vacation start date must be before end date`);
    }

    const calendarDates = expandDateRange(fromDate, toDate);
    const allowedDays: Set<DayOfWeek> | null = input.daysOfWeek?.length ? new Set<DayOfWeek>(input.daysOfWeek) : null;
    const rangeStart = new Date(`${fromDate}T00:00:00.000Z`);
    const rangeEnd = new Date(`${toDate}T23:59:59.999Z`);

    const allTeachers = await fetchAllActiveTeachers(t, input.gender, input.teacherNameSearch);

    if (allTeachers.length === 0) {
      return {
        id: `availability-search-${fromDate}-${toDate}-${input.fromTime}-${input.toTime}`,
        teachers: [],
        totalGaps: 0,
        totalCount: 0,
        pageInfo: PaginationUtils.buildPageInfoFromArgs(
          input.paginationArgs ? new PaginationArgs(input.paginationArgs) : null,
          0,
          0
        ),
      };
    }

    const { options } = await buildSearchOptions({
      t,
      input,
      allTeachers,
      calendarDates,
      allowedDays,
      timeRange,
      rangeStart,
      rangeEnd,
    });

    const matchedTeachers = buildTeacherSearchResults({ allTeachers, ...options });
    const sortedTeachers = sortTeachers(matchedTeachers, input.sortBy);
    const totalGaps = sortedTeachers.reduce((sum, teacher) => sum + teacher.gaps.length, 0);
    const pagination = input.paginationArgs ? new PaginationArgs(input.paginationArgs) : new PaginationArgs();
    const paginatedTeachers = sortedTeachers.slice(pagination.offset, pagination.offset + pagination.perPage);
    const pageInfo = PaginationUtils.buildPageInfoFromArgs(pagination, paginatedTeachers.length, sortedTeachers.length);

    return {
      id: `availability-search-${fromDate}-${toDate}-${input.fromTime}-${input.toTime}`,
      teachers: paginatedTeachers,
      totalGaps,
      totalCount: sortedTeachers.length,
      pageInfo,
    };
  };
}
