import { and, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { buildTeacherSearchResults } from "@/backend/db/repo/teachers/teacher-availability.repository.gaps";
import {
  buildCommonWindowValues,
  buildSearchOptions,
  fetchAllActiveTeachers,
} from "@/backend/db/repo/teachers/teacher-availability.repository.queries";
import {
  teacherAvailabilityWindows,
  teacherRecurringUnavailability,
  teacherVacationRequests,
} from "@/backend/db/schema";
import { type DayOfWeek, VacationRequestStatus } from "@/backend/enum";
import { NotFoundError, ValidationError } from "@/backend/lib/errors";
import type * as Types from "@/backend/types";
import { type DBTransaction, PaginationArgs } from "@/backend/types";
import { expandDateRange, getUtcDateString, type MinuteRange, sortTeachers, timeToMinutes } from "@/backend/utils";
import { PaginationUtils } from "@/backend/utils/pagination.utils";
import { getServerTranslations } from "@/shared/locale";

export namespace TeacherAvailabilityRepository {
  async function acquireAvailabilityLock(tx: DBTransaction, teacherId: string): Promise<void> {
    await acquireAdvisoryLock(tx, `teacher_availability_${teacherId}`);
  }

  async function assertValidTimeRange(startTime: string, endTime: string, locale?: string): Promise<void> {
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new ValidationError(errorsTranslations.scheduling.startTimeBeforeEndTime);
    }
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
  ): Promise<Types.TeacherAvailabilityWindowSelectType> =>
    withAvailabilityLock(
      teacherId,
      input.startTime,
      input.endTime,
      t =>
        t
          .insert(teacherAvailabilityWindows)
          .values(buildCommonWindowValues(teacherId, input))
          .returning()
          .then(([created]) => created),
      tx,
      locale
    );

  export const addRecurringUnavailability = async (
    teacherId: string,
    input: Types.RecurringUnavailabilityInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.TeacherRecurringUnavailabilitySelectType> =>
    withAvailabilityLock(
      teacherId,
      input.startTime,
      input.endTime,
      async t => {
        const values = {
          ...buildCommonWindowValues(teacherId, input),
          reason: input.reason ?? null,
        };
        const [created] = await t.insert(teacherRecurringUnavailability).values(values).returning();
        return created;
      },
      tx,
      locale
    );

  // ── Vacation request data-access methods ──────────────────────────────────

  /**
   * Insert a vacation request row (data-access only; no business validation).
   * Acquires advisory lock within a transaction.
   */
  export const insertVacationRequest = async (
    input: Types.SubmitVacationRequestInput,
    requestedByUserId: string,
    teacherId: string,
    tx?: DBTransaction
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    const runner = async (t: DBTransaction) => {
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

  /**
   * Fetches a vacation request by id with row-level lock (SELECT ... FOR UPDATE).
   */
  export const fetchVacationRequestForUpdate = async (
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
        const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new NotFoundError("VACATION_REQUEST", tErrors.teacher.vacationRequestNotFound(vacationRequestId));
      }

      const current = results[0];
      await acquireAvailabilityLock(t, current.teacherId);
      return current;
    };
    return withTransaction(runner, tx);
  };

  /**
   * Updates a vacation request's status and processed fields (data-access only).
   */
  export const updateVacationRequestStatus = async (
    vacationRequestId: string,
    update: {
      status: VacationRequestStatus;
      processedByUserId?: string;
    },
    tx?: DBTransaction
  ): Promise<Types.TeacherVacationRequestSelectType> => {
    const runner = async (t: DBTransaction) => {
      const now = new Date();
      const [updated] = await t
        .update(teacherVacationRequests)
        .set({
          status: update.status,
          processedAt: update.processedByUserId ? now : undefined,
          processedByUserId: update.processedByUserId ?? undefined,
          updatedAt: now,
        })
        .where(eq(teacherVacationRequests.id, vacationRequestId))
        .returning();
      return updated;
    };
    return withTransaction(runner, tx);
  };

  /**
   * Fetches all availability-relevant data for a teacher in a single batch:
   * approved vacations (overlapping the time range), all recurring
   * unavailability patterns, and all availability windows.
   */
  export const fetchBookingAvailabilityData = async (
    teacherId: string,
    earliestStart: Date,
    latestEnd: Date,
    tx?: DBTransaction
  ): Promise<{
    vacationsRows: { startAt: Date; endAt: Date }[];
    unavailabilityRows: Types.TeacherRecurringUnavailabilitySelectType[];
    windowRows: Types.TeacherAvailabilityWindowSelectType[];
  }> => {
    const t = tx ?? db;
    const [vacationsRows, unavailabilityRows, windowRows] = await Promise.all([
      t
        .select({ startAt: teacherVacationRequests.startAt, endAt: teacherVacationRequests.endAt })
        .from(teacherVacationRequests)
        .where(
          and(
            eq(teacherVacationRequests.teacherId, teacherId),
            eq(teacherVacationRequests.status, VacationRequestStatus.APPROVED),
            sql`(${teacherVacationRequests.startAt} < ${latestEnd} AND ${teacherVacationRequests.endAt} > ${earliestStart})`
          )
        ),
      t.select().from(teacherRecurringUnavailability).where(eq(teacherRecurringUnavailability.teacherId, teacherId)),
      t.select().from(teacherAvailabilityWindows).where(eq(teacherAvailabilityWindows.teacherId, teacherId)),
    ]);
    return { vacationsRows, unavailabilityRows, windowRows };
  };

  export const searchCrossStaffAvailabilityData = async (
    input: Types.CrossStaffSearchInput,
    tx?: DBTransaction
  ): Promise<Types.AvailabilitySearchResult> => {
    const t = tx ?? db;

    const fromMinutes = timeToMinutes(input.fromTime);
    const toMinutes = timeToMinutes(input.toTime);
    const timeRange: MinuteRange = { from: fromMinutes, to: toMinutes };

    const fromDate = input.fromDate ?? getUtcDateString(new Date());
    const toDate = input.toDate ?? getUtcDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

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
