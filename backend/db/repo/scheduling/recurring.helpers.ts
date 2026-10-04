import { checkOverlaps, type DBTransaction, validateTeacherAssignment } from "@/backend/db/repo/scheduling/shared";
import { classInstances, recurringScheduleDays, recurringSchedules } from "@/backend/db/schema";
import { getOffsetMinutes, getOffsetMsSafe } from "@/backend/lib/timezone";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
import type { CreateRecurringScheduleInput, RateSnapshot } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

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

  const offsetMs = getOffsetMsSafe(timezone, guess);

  return new Date(guess.getTime() - offsetMs);
}

export async function insertRecurringScheduleRow(t: DBTransaction, input: CreateRecurringScheduleInput, now: Date) {
  const utcOffsetSnapshot = getOffsetMinutes(input.timezone, now);

  const [recurringSchedule] = await t
    .insert(recurringSchedules)
    .values({
      studentId: input.studentId,
      teacherId: input.teacherId,
      subjectId: input.subjectId,
      durationMinutes: input.durationMinutes,
      defaultStartTime: input.defaultStartTime,
      timezone: input.timezone,
      timezoneId: input.timezoneId ?? null,
      utcOffsetSnapshot,
      hourlyRate: input.hourlyRate ?? null,
      rateCurrency: input.rateCurrency ?? null,
      effectiveFrom: input.effectiveFrom ? input.effectiveFrom.toISOString().split("T")[0] : null,
      effectiveUntil: input.effectiveUntil ? input.effectiveUntil.toISOString().split("T")[0] : null,
      quotaId: input.quotaId ?? null,
      earmarkedClasses: input.earmarkedClasses ?? null,
      schedulingMode: input.schedulingMode ?? "NUMBER_OF_CLASSES",
      generationHorizonWeeks: input.generationHorizonWeeks ?? null,
      ondemandNoCreditsOutcome: input.ondemandNoCreditsOutcome ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return { recurringSchedule, utcOffsetSnapshot };
}

export async function insertScheduleDays(
  t: DBTransaction,
  recurringScheduleId: string,
  input: CreateRecurringScheduleInput
) {
  const insertedDays = await t
    .insert(recurringScheduleDays)
    .values(
      input.days.map(day => ({
        recurringScheduleId,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        isActive: day.isActive,
      }))
    )
    .returning();
  return insertedDays;
}

type ComputedInstanceRow = {
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  dayOfWeek: string;
  idempotencyKey: string;
};

export function computeInstanceRows(
  insertedDays: { dayOfWeek: string; startTime: string; isActive: boolean }[],
  recurringScheduleId: string,
  effectiveStartDate: Date,
  weeksToGenerate: number,
  durationMinutes: number,
  timezone: string
): ComputedInstanceRow[] {
  const instanceRows: ComputedInstanceRow[] = [];

  for (let weekOffset = 0; weekOffset < weeksToGenerate; weekOffset++) {
    for (const day of insertedDays) {
      if (!day.isActive) continue;

      const scheduledStartAt = computeScheduledStartForDay(
        day.dayOfWeek,
        day.startTime,
        effectiveStartDate,
        weekOffset,
        timezone
      );
      const scheduledEndAt = new Date(scheduledStartAt.getTime() + durationMinutes * 60000);
      const idempotencyKey = `recurring-${recurringScheduleId}-${day.dayOfWeek}-${scheduledStartAt.toISOString()}`;

      instanceRows.push({ scheduledStartAt, scheduledEndAt, dayOfWeek: day.dayOfWeek, idempotencyKey });
    }
  }

  return instanceRows;
}

export async function validateInstanceBatch(
  t: DBTransaction,
  input: CreateRecurringScheduleInput,
  instanceRows: ComputedInstanceRow[],
  tFuncErrors: ErrorsLabels
): Promise<void> {
  // Validate teacher assignment once with the earliest start date — if the
  // assignment covers the earliest occurrence, it covers all later ones too.
  const earliestStartMs = Math.min(...instanceRows.map(r => r.scheduledStartAt.getTime()));
  const earliestStart = new Date(earliestStartMs);
  await validateTeacherAssignment(t, input.studentId, input.teacherId, earliestStart, tFuncErrors);

  // Batched availability check: 3 queries total instead of 3 per instance.
  await AvailabilityService.validateBookingAvailabilityBatch(
    input.teacherId,
    instanceRows.map(r => ({ startTime: r.scheduledStartAt, endTime: r.scheduledEndAt })),
    t,
    "ar"
  );

  // Per-slot overlap checks against pre-existing committed instances. These
  // run BEFORE any of our batched inserts, so they correctly exclude each
  // other (new in-transaction rows are not visible to the snapshot read).
  // Within the batch, no two slots overlap because each (day, weekOffset)
  // pair maps to a distinct UTC start time.
  // Sequential reduce chain — all iterations share the same DB transaction.
  await instanceRows.reduce(async (prev, row) => {
    await prev;
    return checkOverlaps(
      t,
      {
        studentId: input.studentId,
        teacherId: input.teacherId,
        startTime: row.scheduledStartAt,
        endTime: row.scheduledEndAt,
      },
      tFuncErrors
    );
  }, Promise.resolve());
}

export async function insertInstanceBatch(
  t: DBTransaction,
  input: CreateRecurringScheduleInput,
  recurringScheduleId: string,
  instanceRows: ComputedInstanceRow[],
  rateSnapshot: RateSnapshot,
  utcOffsetSnapshot: number | null,
  now: Date
): Promise<string[]> {
  const insertedInstances = await t
    .insert(classInstances)
    .values(
      instanceRows.map(row => ({
        studentId: input.studentId,
        teacherId: input.teacherId,
        subjectId: input.subjectId,
        recurringScheduleId,
        scheduledStartAt: row.scheduledStartAt,
        scheduledEndAt: row.scheduledEndAt,
        bookingTimezone: input.timezone,
        bookingUtcOffset: utcOffsetSnapshot,
        bookingTimezoneId: input.timezoneId ?? null,
        durationMinutes: input.durationMinutes,
        classType: input.classType ?? "REGULAR",
        executionState: "NOT_ACTIVATED",
        outcome: "PENDING",
        quotaDeducted: !!input.quotaDeducted,
        rateAmount: rateSnapshot.rateAmount,
        rateCurrency: rateSnapshot.rateCurrency,
        isRateOverridden: false,
        rateSource: rateSnapshot.rateSource,
        idempotencyKey: row.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .returning({ id: classInstances.id });

  return insertedInstances.map(i => i.id);
}

/** Narrows the schedules flagged for quota refund to those with earmarked classes to release. */
export function collectQuotaSchedules(
  schedules: { id: string; studentId: string; quotaId: string | null; earmarkedClasses: number | null }[]
): { id: string; studentId: string; quotaId: string; earmarkedClasses: number }[] {
  const quotaSchedules: { id: string; studentId: string; quotaId: string; earmarkedClasses: number }[] = [];
  for (const s of schedules) {
    if (s.quotaId && s.earmarkedClasses && s.earmarkedClasses > 0) {
      quotaSchedules.push({
        id: s.id,
        studentId: s.studentId,
        quotaId: s.quotaId,
        earmarkedClasses: s.earmarkedClasses,
      });
    }
  }
  return quotaSchedules;
}
