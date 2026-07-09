import { and, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  acquireLocks,
  checkOverlaps,
  type DBTransaction,
  validateTeacherAssignment,
} from "@/backend/db/repo/scheduling/shared";
import { handleQuotaDeduction } from "@/backend/db/repo/scheduling/state-changes";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teacher-availability.repository";
import { classInstances, recurringScheduleDays, recurringSchedules, students } from "@/backend/db/schema";
import { IanaTimezone } from "@/backend/enum/timezone.enum";

export interface CreateRecurringScheduleInput {
  studentId: string;
  teacherId: string;
  durationMinutes: number;
  defaultStartTime: string;
  timezone: string;
  timezoneId?: number | null;
  effectiveFrom?: Date | null;
  effectiveUntil?: Date | null;
  days: {
    dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    startTime: string;
    isActive: boolean;
  }[];
  classType?: "REGULAR" | "TRIAL" | "ADVANCE";
  generateInstancesForWeeks?: number;
  quotaDeducted?: boolean;
}

function computeScheduledStartForDay(
  dayOfWeek: string,
  startTime: string,
  effectiveStartDate: Date,
  weekOffset: number,
  timezone: string
): Date {
  const dayMap: Record<string, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  const targetDay = dayMap[dayOfWeek];
  const startDay = effectiveStartDate.getUTCDay();
  let daysUntilTarget = targetDay - startDay;
  if (daysUntilTarget < 0) daysUntilTarget += 7;
  daysUntilTarget += weekOffset * 7;

  const [hours, minutes] = startTime.split(":").map(Number);

  const result = new Date(effectiveStartDate);
  result.setUTCDate(result.getUTCDate() + daysUntilTarget);

  const year = result.getUTCFullYear();
  const month = result.getUTCMonth();
  const date = result.getUTCDate();

  const guess = new Date(Date.UTC(year, month, date, hours, minutes, 0, 0));

  const getOffsetMs = (d: Date) => {
    try {
      const utcDate = new Date(d.toLocaleString("en-US", { timeZone: IanaTimezone.UTC }));
      const tzDate = new Date(d.toLocaleString("en-US", { timeZone: timezone }));
      return tzDate.getTime() - utcDate.getTime();
    } catch {
      return 0;
    }
  };

  const offsetMs = getOffsetMs(guess);

  return new Date(guess.getTime() - offsetMs);
}

async function validateRecurringScheduleAvailability(
  t: DBTransaction,
  studentId: string,
  teacherId: string,
  scheduledStartAt: Date,
  scheduledEndAt: Date,
  locale?: string
): Promise<void> {
  await acquireLocks(t, teacherId, studentId);
  await validateTeacherAssignment(t, studentId, teacherId, scheduledStartAt, locale);
  await TeacherAvailabilityRepository.validateBookingAvailability(teacherId, scheduledStartAt, scheduledEndAt, t);
  await checkOverlaps(
    t,
    {
      studentId,
      teacherId,
      startTime: scheduledStartAt,
      endTime: scheduledEndAt,
    },
    locale
  );
}

async function createSingleRecurringInstance(params: {
  t: DBTransaction;
  recurringScheduleId: string;
  day: { dayOfWeek: string; startTime: string; isActive: boolean };
  weekOffset: number;
  effectiveStartDate: Date;
  input: CreateRecurringScheduleInput;
  utcOffsetSnapshot: number | null;
  now: Date;
  locale?: string;
}): Promise<string> {
  const { t, recurringScheduleId, day, weekOffset, effectiveStartDate, input, utcOffsetSnapshot, now, locale } = params;
  const scheduledStartAt = computeScheduledStartForDay(
    day.dayOfWeek,
    day.startTime,
    effectiveStartDate,
    weekOffset,
    input.timezone
  );
  const scheduledEndAt = new Date(scheduledStartAt.getTime() + input.durationMinutes * 60000);

  await validateRecurringScheduleAvailability(
    t,
    input.studentId,
    input.teacherId,
    scheduledStartAt,
    scheduledEndAt,
    locale
  );

  await handleQuotaDeduction(t, input.studentId, !!input.quotaDeducted, locale);

  const idempotencyKey = `recurring-${recurringScheduleId}-${day.dayOfWeek}-${scheduledStartAt.toISOString()}`;

  const [classInstance] = await t
    .insert(classInstances)
    .values({
      studentId: input.studentId,
      teacherId: input.teacherId,
      recurringScheduleId,
      scheduledStartAt,
      scheduledEndAt,
      bookingTimezone: input.timezone,
      bookingUtcOffset: utcOffsetSnapshot,
      bookingTimezoneId: input.timezoneId ?? null,
      durationMinutes: input.durationMinutes,
      classType: input.classType ?? "REGULAR",
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return classInstance.id;
}

export async function deleteRecurringClass(classInstanceId: string, tx?: DBTransaction): Promise<boolean> {
  const runner = async (t: DBTransaction) => {
    const now = new Date();

    const [existing] = await t
      .select({
        id: classInstances.id,
        quotaDeducted: classInstances.quotaDeducted,
        deletedAt: classInstances.deletedAt,
        studentId: classInstances.studentId,
      })
      .from(classInstances)
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);

    if (existing?.quotaDeducted && existing.deletedAt === null) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, existing.studentId));
    }

    const [deleted] = await t
      .update(classInstances)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(classInstances.id, classInstanceId))
      .returning({ id: classInstances.id });

    return !!deleted;
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
}

export async function clearWeeklySchedule(teacherId: string, tx?: DBTransaction): Promise<boolean> {
  const runner = async (t: DBTransaction) => {
    const now = new Date();

    const schedules = await t
      .select({ id: recurringSchedules.id })
      .from(recurringSchedules)
      .where(and(eq(recurringSchedules.teacherId, teacherId), isNull(recurringSchedules.deletedAt)));

    if (schedules.length === 0) {
      return false;
    }

    const scheduleIds = schedules.map(s => s.id);

    await t
      .update(recurringScheduleDays)
      .set({ isActive: false })
      .where(inArray(recurringScheduleDays.recurringScheduleId, scheduleIds));

    await t
      .update(recurringSchedules)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(inArray(recurringSchedules.id, scheduleIds));

    const orphanedInstances = await t
      .select({
        id: classInstances.id,
        quotaDeducted: classInstances.quotaDeducted,
        studentId: classInstances.studentId,
      })
      .from(classInstances)
      .where(
        and(
          inArray(classInstances.recurringScheduleId, scheduleIds),
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, now)
        )
      );

    for (const instance of orphanedInstances) {
      if (instance.quotaDeducted) {
        await t
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
          .where(eq(students.id, instance.studentId));
      }
    }

    if (orphanedInstances.length > 0) {
      await t
        .update(classInstances)
        .set({ deletedAt: now, updatedAt: now })
        .where(
          inArray(
            classInstances.id,
            orphanedInstances.map(i => i.id)
          )
        );
    }

    return true;
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
}

export const createRecurringScheduleWithInstances = async (
  input: CreateRecurringScheduleInput,
  tx?: DBTransaction,
  locale?: string
): Promise<{ recurringScheduleId: string; classInstanceIds: string[] }> => {
  const runner = async (t: DBTransaction) => {
    const now = new Date();

    const getOffsetMinutes = (ianaTimezone: string, d: Date) => {
      try {
        const utcDate = new Date(d.toLocaleString("en-US", { timeZone: IanaTimezone.UTC }));
        const tzDate = new Date(d.toLocaleString("en-US", { timeZone: ianaTimezone }));
        return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
      } catch {
        return null;
      }
    };
    const utcOffsetSnapshot = getOffsetMinutes(input.timezone, now);

    const [recurringSchedule] = await t
      .insert(recurringSchedules)
      .values({
        studentId: input.studentId,
        teacherId: input.teacherId,
        durationMinutes: input.durationMinutes,
        defaultStartTime: input.defaultStartTime,
        timezone: input.timezone,
        timezoneId: input.timezoneId ?? null,
        utcOffsetSnapshot,
        effectiveFrom: input.effectiveFrom ? input.effectiveFrom.toISOString().split("T")[0] : null,
        effectiveUntil: input.effectiveUntil ? input.effectiveUntil.toISOString().split("T")[0] : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const insertedDays = await t
      .insert(recurringScheduleDays)
      .values(
        input.days.map(day => ({
          recurringScheduleId: recurringSchedule.id,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          isActive: day.isActive,
        }))
      )
      .returning();

    const classInstanceIds: string[] = [];
    const weeksToGenerate = input.generateInstancesForWeeks ?? 1;
    const effectiveStartDate = input.effectiveFrom ? new Date(input.effectiveFrom) : now;

    for (let weekOffset = 0; weekOffset < weeksToGenerate; weekOffset++) {
      for (const day of insertedDays) {
        if (!day.isActive) continue;

        const instanceId = await createSingleRecurringInstance({
          t,
          recurringScheduleId: recurringSchedule.id,
          day,
          weekOffset,
          effectiveStartDate,
          input,
          utcOffsetSnapshot,
          now,
          locale,
        });
        classInstanceIds.push(instanceId);
      }
    }

    return {
      recurringScheduleId: recurringSchedule.id,
      classInstanceIds,
    };
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};
