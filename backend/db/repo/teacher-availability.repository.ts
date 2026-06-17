import { and, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  teacherAvailabilityWindows,
  teacherRecurringUnavailability,
  teacherVacationRequests,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";
import { DayOfWeek, VacationRequestStatus } from "@/shared/lib/enum";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
}
