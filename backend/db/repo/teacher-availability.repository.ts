import { and, eq, gte, ilike, inArray, isNull, lte, sql } from "drizzle-orm";
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
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";
import { PaginationArgs } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import { PaginationUtils } from "@/backend/utils/pagination.utils";
import type { DBTransaction } from "../db.types";

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
  const current = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);
  while (current <= end) {
    dates.push(getUtcDateString(current));
    current.setUTCDate(current.getUTCDate() + 1);
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

function findGapsForCalendarDate(
  teacher: TeacherShortInfo,
  calendarDate: string,
  day: DayOfWeek,
  dayWindows: Types.TeacherAvailabilityWindowSelectType[],
  dayUnavail: Types.TeacherRecurringUnavailabilitySelectType[],
  extraBlocked: { start: number; end: number }[],
  fromMinutes: number,
  toMinutes: number
): Types.TeacherAvailabilityGap[] {
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
  teachers: Types.AvailabilitySearchTeacher[],
  sortBy: AvailabilitySearchSortBy | null | undefined
): Types.AvailabilitySearchTeacher[] {
  const sorted = [...teachers];

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
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("startTimeBeforeEndTime"));
    }
  }

  export const addAvailabilityWindow = async (
    teacherId: string,
    input: Types.AvailabilityWindowInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherAvailabilityWindowSelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireAvailabilityLock(t, teacherId);
      await assertValidTimeRange(input.startTime, input.endTime, locale);
      const now = new Date();

      const [created] = await t
        .insert(teacherAvailabilityWindows)
        .values({
          teacherId,
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
    teacherId: string,
    input: Types.RecurringUnavailabilityInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherRecurringUnavailabilitySelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireAvailabilityLock(t, teacherId);
      await assertValidTimeRange(input.startTime, input.endTime, locale);
      const now = new Date();

      const [created] = await t
        .insert(teacherRecurringUnavailability)
        .values({
          teacherId,
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
    requestedByUserId: string,
    teacherId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    const runner = async (t: DBTransaction) => {
      if (input.startAt >= input.endAt) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("vacationStartBeforeEnd"));
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

  async function processVacationRequest(
    input: Types.ProcessVacationRequestInput,
    status: VacationRequestStatus.APPROVED | VacationRequestStatus.REJECTED,
    processedByUserId: string,
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
          processedByUserId,
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

  function buildTeacherQueryConditions(gender: Gender | null | undefined, teacherNameSearch?: string | null) {
    const conditions = [eq(teachers.status, "ACTIVATED")];
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
        teacherTimezone: teachers.timezone,
      })
      .from(teachers)
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(and(...buildTeacherQueryConditions(gender, teacherNameSearch)))
      .limit(100);
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

  function buildTeacherSearchResults(
    allTeachers: TeacherShortInfo[],
    windowsByTeacher: Map<string, Types.TeacherAvailabilityWindowSelectType[]>,
    unavailabilitiesByTeacher: Map<string, Types.TeacherRecurringUnavailabilitySelectType[]>,
    vacationsByTeacher: Map<string, { startAt: Date; endAt: Date }[]>,
    bookingsByTeacher: Map<string, { scheduledStartAt: Date; scheduledEndAt: Date }[]>,
    calendarDates: string[],
    allowedDays: Set<DayOfWeek> | null,
    fromMinutes: number,
    toMinutes: number,
    minAvailableDays: number | null | undefined,
    minTotalGaps: number | null | undefined
  ): Types.AvailabilitySearchTeacher[] {
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

        const dayWindows = windows.filter(window => (window.dayOfWeek as DayOfWeek) === day);
        const dayUnavail = unavailabilities.filter(
          unavailability =>
            (unavailability.dayOfWeek as DayOfWeek) === day &&
            isWithinEffectiveRange(calendarDate, unavailability.effectiveFrom, unavailability.effectiveUntil)
        );
        const extraBlocked = [
          ...getVacationBlockedRangesForDate(calendarDate, vacations),
          ...getBookingBlockedRangesForDate(calendarDate, bookings),
        ];

        const dayGaps = findGapsForCalendarDate(
          teacher,
          calendarDate,
          day,
          dayWindows,
          dayUnavail,
          extraBlocked,
          fromMinutes,
          toMinutes
        );
        gaps.push(...dayGaps);
      }

      const availableDaysCount = countAvailableDays(gaps);
      const meetsMinDays = minAvailableDays == null || availableDaysCount >= minAvailableDays;
      const meetsMinGaps = minTotalGaps == null || gaps.length >= minTotalGaps;

      if (gaps.length > 0 && meetsMinDays && meetsMinGaps) {
        result.push({
          id: teacher.teacherId,
          name: teacher.teacherName ?? "Unknown",
          gender: teacher.teacherGender as Gender | null,
          timezone: teacher.teacherTimezone,
          availableDaysCount,
          gaps,
        });
      }
    }

    return result;
  }

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

    const fromDate = input.fromDate ?? getUtcDateString(new Date());
    const toDate = input.toDate ?? getUtcDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

    if (fromDate > toDate) {
      const tFunc = await getBackendTranslations({ locale: undefined, namespace: "errors" });
      throw new Error(tFunc("startTimeBeforeEndTime"));
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

    const teacherIds = allTeachers.map(teacher => teacher.teacherId);
    const { windowsByTeacher, unavailabilitiesByTeacher } = await fetchTeacherAvailabilityData(t, teacherIds);
    const vacations = await fetchApprovedVacations(t, teacherIds, rangeStart, rangeEnd);
    const bookings = await fetchTeacherBookings(t, teacherIds, rangeStart, rangeEnd);

    const vacationsByTeacher = groupByTeacherId(vacations);
    const bookingsByTeacher = groupByTeacherId(bookings);

    const matchedTeachers = buildTeacherSearchResults(
      allTeachers,
      windowsByTeacher,
      unavailabilitiesByTeacher,
      vacationsByTeacher,
      bookingsByTeacher,
      calendarDates,
      allowedDays,
      fromMinutes,
      toMinutes,
      input.minAvailableDays,
      input.minTotalGaps
    );

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
