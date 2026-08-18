import { and, eq } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import {
  teacherAvailabilityWindows,
  teacherRecurringUnavailability,
  teacherVacationRequests,
} from "@/backend/db/schema";
import type { DayOfWeek } from "@/backend/enum";
import type {
  AvailabilityWindowUpsertInput,
  DBTransaction,
  RecurringUnavailabilityCreateInput,
  TeacherAvailabilityWindowSelectType,
  TeacherRecurringUnavailabilitySelectType,
  TeacherVacationRequestSelectType,
  VacationRequestCreateInput,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export namespace TeacherAvailabilityBootstrapRepository {
  export async function findWindowByTeacherAndDay(
    teacherId: string,
    dayOfWeek: DayOfWeek,
    tx?: DBTransaction
  ): Promise<TeacherAvailabilityWindowSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q
      .select()
      .from(teacherAvailabilityWindows)
      .where(
        and(eq(teacherAvailabilityWindows.teacherId, teacherId), eq(teacherAvailabilityWindows.dayOfWeek, dayOfWeek))
      )
      .limit(1);
    return row ?? null;
  }

  export async function upsertAvailabilityWindow(
    input: AvailabilityWindowUpsertInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherAvailabilityWindowSelectType> {
    const executor = tx ?? db;
    const now = new Date();
    const existing = await findWindowByTeacherAndDay(input.teacherId, input.dayOfWeek, tx);
    if (existing) {
      const [updated] = await executor
        .update(teacherAvailabilityWindows)
        .set({
          startTime: input.startTime,
          endTime: input.endTime,
          timezone: input.timezone,
          timezoneId: input.timezoneId,
          effectiveFrom: input.effectiveFrom,
          effectiveUntil: input.effectiveUntil,
          updatedAt: now,
        })
        .where(eq(teacherAvailabilityWindows.id, existing.id))
        .returning();
      if (!updated) {
        const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(i18n.teacher.availabilityUpdateFailed);
      }
      return updated;
    }
    const [inserted] = await executor
      .insert(teacherAvailabilityWindows)
      .values({
        teacherId: input.teacherId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone,
        timezoneId: input.timezoneId,
        effectiveFrom: input.effectiveFrom,
        effectiveUntil: input.effectiveUntil,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!inserted) {
      const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(i18n.teacher.availabilityInsertFailed);
    }
    return inserted;
  }

  export async function findRecurringByTeacherAndDay(
    teacherId: string,
    dayOfWeek: DayOfWeek,
    tx?: DBTransaction
  ): Promise<TeacherRecurringUnavailabilitySelectType | null> {
    const q = queryDb(tx);
    const [row] = await q
      .select()
      .from(teacherRecurringUnavailability)
      .where(
        and(
          eq(teacherRecurringUnavailability.teacherId, teacherId),
          eq(teacherRecurringUnavailability.dayOfWeek, dayOfWeek)
        )
      )
      .limit(1);
    return row ?? null;
  }

  export async function createRecurringIfMissing(
    input: RecurringUnavailabilityCreateInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherRecurringUnavailabilitySelectType> {
    const existing = await findRecurringByTeacherAndDay(input.teacherId, input.dayOfWeek, tx);
    if (existing) return existing;
    const executor = tx ?? db;
    const now = new Date();
    const [inserted] = await executor
      .insert(teacherRecurringUnavailability)
      .values({
        teacherId: input.teacherId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        timezone: input.timezone,
        timezoneId: input.timezoneId,
        effectiveFrom: input.effectiveFrom,
        effectiveUntil: input.effectiveUntil,
        reason: input.reason,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!inserted) {
      const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(i18n.teacher.recurringUnavailabilityInsertFailed);
    }
    return inserted;
  }

  export async function findVacationByTeacherId(
    teacherId: string,
    tx?: DBTransaction
  ): Promise<TeacherVacationRequestSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q
      .select()
      .from(teacherVacationRequests)
      .where(eq(teacherVacationRequests.teacherId, teacherId))
      .limit(1);
    return row ?? null;
  }

  export async function createVacationIfMissing(
    input: VacationRequestCreateInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherVacationRequestSelectType> {
    const existing = await findVacationByTeacherId(input.teacherId, tx);
    if (existing) return existing;
    const executor = tx ?? db;
    const now = new Date();
    const [inserted] = await executor
      .insert(teacherVacationRequests)
      .values({
        teacherId: input.teacherId,
        requestedByUserId: input.requestedByUserId,
        startAt: input.startAt,
        endAt: input.endAt,
        timezone: input.timezone,
        timezoneId: input.timezoneId,
        reason: input.reason,
        status: input.status,
        processedAt: input.processedAt,
        processedByUserId: input.processedByUserId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!inserted) {
      const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(i18n.teacher.vacationInsertFailed);
    }
    return inserted;
  }
}
