import { and, eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import {
  teacherAvailabilityWindows,
  teacherRecurringUnavailability,
  teacherVacationRequests,
} from "@/backend/db/schema";
import type { DayOfWeek, VacationRequestStatus } from "@/backend/enum";
import type {
  TeacherAvailabilityWindowSelectType,
  TeacherRecurringUnavailabilitySelectType,
  TeacherVacationRequestSelectType,
} from "@/backend/types";

export type AvailabilityWindowUpsertInput = {
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone: string;
  timezoneId: number | null;
  effectiveFrom: string;
  effectiveUntil: string;
};

export type RecurringUnavailabilityCreateInput = {
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone: string;
  timezoneId: number | null;
  effectiveFrom: string;
  effectiveUntil: string;
  reason: string;
};

export type VacationRequestCreateInput = {
  teacherId: string;
  requestedByUserId: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  timezoneId: number | null;
  reason: string;
  status: VacationRequestStatus;
  processedAt: Date | null;
  processedByUserId: string | null;
};

export namespace TeacherAvailabilityBootstrapRepository {
  export async function findWindowByTeacherAndDay(
    teacherId: string,
    dayOfWeek: DayOfWeek,
    tx?: DBTransaction
  ): Promise<TeacherAvailabilityWindowSelectType | null> {
    const executor = tx ?? db;
    const [row] = await executor
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
    tx?: DBTransaction
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
      if (!updated) throw new Error("Availability window update failed");
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
    if (!inserted) throw new Error("Availability window insert failed");
    return inserted;
  }

  export async function findRecurringByTeacherAndDay(
    teacherId: string,
    dayOfWeek: DayOfWeek,
    tx?: DBTransaction
  ): Promise<TeacherRecurringUnavailabilitySelectType | null> {
    const executor = tx ?? db;
    const [row] = await executor
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
    tx?: DBTransaction
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
    if (!inserted) throw new Error("Recurring unavailability insert failed");
    return inserted;
  }

  export async function findVacationByTeacherId(
    teacherId: string,
    tx?: DBTransaction
  ): Promise<TeacherVacationRequestSelectType | null> {
    const executor = tx ?? db;
    const [row] = await executor
      .select()
      .from(teacherVacationRequests)
      .where(eq(teacherVacationRequests.teacherId, teacherId))
      .limit(1);
    return row ?? null;
  }

  export async function createVacationIfMissing(
    input: VacationRequestCreateInput,
    tx?: DBTransaction
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
    if (!inserted) throw new Error("Vacation request insert failed");
    return inserted;
  }
}
