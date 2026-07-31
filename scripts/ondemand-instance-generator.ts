import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { CreditRepository } from "@/backend/db/repo/billing/credit.repository";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { classInstances, recurringScheduleDays, recurringSchedules } from "@/backend/db/schema";
import { ClassExecutionState, ClassType, DayOfWeek, OnDemandStatus, SchedulingMode } from "@/backend/enum";

import { logger } from "@/backend/lib/logger";
import { QuotaService } from "@/backend/services/billing/quota.service";
import type { ClassInstanceInsertInput } from "@/backend/types";

const DAY_OF_WEEK_MAP: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

interface ExecutionStateResult {
  executionState: ClassExecutionState;
  ondemandStatus: OnDemandStatus | null;
}

function determineExecutionState(isAvailable: boolean, hasBalance: boolean): ExecutionStateResult {
  if (!isAvailable) {
    return { executionState: ClassExecutionState.ON_DEMAND_CONFLICT_HELD, ondemandStatus: null };
  }
  if (!hasBalance) {
    return {
      executionState: ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
      ondemandStatus: OnDemandStatus.PENDING_CREDIT,
    };
  }
  return { executionState: ClassExecutionState.NOT_ACTIVATED, ondemandStatus: OnDemandStatus.AVAILABLE };
}

async function insertInstanceIfMissing(
  schedule: typeof recurringSchedules.$inferSelect,
  currentDate: Date,
  scheduledStartAt: Date,
  scheduledEndAt: Date,
  executionState: ClassExecutionState,
  ondemandStatus: OnDemandStatus | null
): Promise<boolean> {
  const dateIso = scheduledStartAt.toISOString().split("T")[0];
  const idempotencyKey = `recurring-${schedule.id}-${currentDate.getDay()}-${dateIso}`;

  return db.transaction(async tx => {
    const existing = await tx
      .select()
      .from(classInstances)
      .where(
        and(
          eq(classInstances.recurringScheduleId, schedule.id),
          eq(classInstances.scheduledStartAt, scheduledStartAt),
          isNull(classInstances.deletedAt)
        )
      )
      .limit(1);

    if (existing.length > 0) return false;

    await tx.insert(classInstances).values({
      recurringScheduleId: schedule.id,
      studentId: schedule.studentId,
      teacherId: schedule.teacherId,
      subjectId: schedule.subjectId,
      durationMinutes: schedule.durationMinutes,
      classType: ClassType.REGULAR,
      bookingTimezone: schedule.timezone,
      scheduledStartAt,
      scheduledEndAt,
      executionState,
      ondemandStatus,
      quotaDeducted: false,
      idempotencyKey,
    } as ClassInstanceInsertInput);

    return true;
  });
}

export async function runOndemandInstanceGenerator(): Promise<void> {
  logger.info("[OnDemandInstanceGenerator] Starting on-demand instance generation...");

  try {
    const schedules = await db
      .select()
      .from(recurringSchedules)
      .where(
        and(eq(recurringSchedules.schedulingMode, SchedulingMode.ON_DEMAND), isNull(recurringSchedules.deletedAt))
      );

    logger.info(`[OnDemandInstanceGenerator] Found ${schedules.length} active ON_DEMAND schedules.`);

    const now = new Date();
    let totalGenerated = 0;

    for (const schedule of schedules) {
      const generated = await generateInstancesForSchedule(schedule, now);
      totalGenerated += generated;
    }

    logger.info(`[OnDemandInstanceGenerator] Completed generation. Generated ${totalGenerated} instances.`);
  } catch (error) {
    logger.error("[OnDemandInstanceGenerator] Error running on-demand instance generator:", { error });
    throw error;
  }
}

async function tryGenerateSlotDay(
  schedule: typeof recurringSchedules.$inferSelect,
  currentDate: Date,
  matchingDay: typeof recurringScheduleDays.$inferSelect,
  remainingBalance: number,
  existingConflicts: Set<string>,
  scheduleDaysMap: Map<string, boolean> | null
): Promise<{ generated: boolean; remaining: number }> {
  const [startHour, startMin] = matchingDay.startTime.split(":").map(Number);
  const scheduledStartAt = new Date(currentDate);
  scheduledStartAt.setHours(startHour, startMin, 0, 0);

  const dateIso = scheduledStartAt.toISOString().split("T")[0];
  const slotKey = `${schedule.id}-${dateIso}`;

  // Check if this exact slot already has a conflicting instance for either student or teacher
  let isAvailable = true;
  if (existingConflicts.has(slotKey)) {
    isAvailable = false;
  } else if (scheduleDaysMap) {
    // Check teacher availability windows by day of week
    const dayOfWeek = DAY_OF_WEEK_MAP[currentDate.getDay()];
    isAvailable = scheduleDaysMap.get(dayOfWeek) === true;
  }

  const scheduledEndAt = new Date(scheduledStartAt.getTime() + schedule.durationMinutes * 60 * 1000);

  const { executionState, ondemandStatus } = determineExecutionState(isAvailable, remainingBalance > 0);
  const inserted = await insertInstanceIfMissing(
    schedule,
    new Date(currentDate),
    scheduledStartAt,
    scheduledEndAt,
    executionState,
    ondemandStatus
  );
  if (!inserted) return { generated: false, remaining: remainingBalance };

  const newRemaining = executionState === ClassExecutionState.NOT_ACTIVATED ? remainingBalance - 1 : remainingBalance;
  return { generated: true, remaining: newRemaining };
}

async function generateInstancesForSchedule(
  schedule: typeof recurringSchedules.$inferSelect,
  now: Date
): Promise<number> {
  const horizonWeeks = schedule.generationHorizonWeeks ?? 2;
  const effectiveFromDate = schedule.effectiveFrom ? new Date(schedule.effectiveFrom) : now;
  const startDate = effectiveFromDate > now ? effectiveFromDate : now;
  const horizonEndDate = new Date(startDate.getTime() + horizonWeeks * 7 * 24 * 60 * 60 * 1000);
  const effectiveUntilDate = schedule.effectiveUntil ? new Date(schedule.effectiveUntil) : null;
  const scheduleEndDate =
    effectiveUntilDate && effectiveUntilDate < horizonEndDate ? effectiveUntilDate : horizonEndDate;

  const scheduleDays = await db
    .select()
    .from(recurringScheduleDays)
    .where(and(eq(recurringScheduleDays.recurringScheduleId, schedule.id), eq(recurringScheduleDays.isActive, true)));

  if (scheduleDays.length === 0) return 0;

  const creditBalance = await CreditRepository.getBalance(db, schedule.studentId);
  const activeQuotas = await QuotaRepository.listActiveByStudent(db, schedule.studentId);
  const totalQuotaRemaining = activeQuotas.reduce((sum, q) => sum + q.remaining, 0);
  const availableBalance = creditBalance.classesRemaining + totalQuotaRemaining;

  // Batch-fetch all overlapping class instances for the entire horizon range in one query
  const overlappingInstances = await db
    .select({
      id: classInstances.id,
      scheduledStartAt: classInstances.scheduledStartAt,
      studentId: classInstances.studentId,
      teacherId: classInstances.teacherId,
    })
    .from(classInstances)
    .where(
      and(
        isNull(classInstances.deletedAt),
        sql`${classInstances.scheduledStartAt} < ${scheduleEndDate}`,
        sql`${classInstances.scheduledEndAt} > ${startDate}`,
        sql`(${classInstances.studentId} = ${schedule.studentId} OR ${classInstances.teacherId} = ${schedule.teacherId})`
      )
    );

  // Build a Set of date-based slot keys that are already taken
  const existingConflicts = new Set<string>();
  for (const inst of overlappingInstances) {
    const dateKey = inst.scheduledStartAt.toISOString().split("T")[0];
    const slotKey = `${schedule.id}-${dateKey}`;
    existingConflicts.add(slotKey);
  }

  let generated = 0;
  let remainingBalance = availableBalance;
  const currentDate = new Date(startDate);
  while (currentDate <= scheduleEndDate) {
    const dayOfWeekEnum = DAY_OF_WEEK_MAP[currentDate.getDay()];
    const matchingDay = scheduleDays.find(d => d.dayOfWeek === dayOfWeekEnum);

    if (matchingDay) {
      const result = await tryGenerateSlotDay(
        schedule,
        currentDate,
        matchingDay,
        remainingBalance,
        existingConflicts,
        null
      );
      if (result.generated) {
        generated++;
        remainingBalance = result.remaining;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (generated > 0) {
    await QuotaService.refreshStudentOndemandInstances(schedule.studentId);
  }

  return generated;
}

if (import.meta.main) {
  runOndemandInstanceGenerator()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
