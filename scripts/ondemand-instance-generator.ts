import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { CreditRepository } from "@/backend/db/repo/billing/credit.repository";
import { classInstances, quotas, recurringScheduleDays, recurringSchedules } from "@/backend/db/schema";
import { ClassExecutionState, ClassType, DayOfWeek, OnDemandStatus, QuotaStatus, SchedulingMode } from "@/backend/enum";

import { logger } from "@/backend/lib/logger";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
import type { ClassInstanceInsertType } from "@/backend/types";

/** Maximum number of recurring schedules to process per batch (unbounded SELECT guard — RP2-8). */
const MAX_SCHEDULES_PER_RUN = 500;

/**
 * Maximum overlapping existing instances to load per schedule window (unbounded
 * SELECT guard — the query scans a slab of classInstances by date range +
 * student/teacher equality). The 2-week horizon bounds cardinality in
 * practice, but cap defensively to avoid unbounded growth for high-volume
 * teachers.
 */
const MAX_OVERLAPPING_INSTANCES_PER_SCHEDULE = 1000;

/**
 * Maps the short weekday name returned by `Intl.DateTimeFormat("en-US", { weekday: "short" })`
 * to the canonical DayOfWeek enum value. Used for IANA timezone-aware DOW matching
 * (V3-009) so the weekday is resolved in the schedule's timezone, not server-local time.
 */
const SHORT_WEEKDAY_TO_ENUM: Record<string, DayOfWeek> = {
  Sun: DayOfWeek.SUNDAY,
  Mon: DayOfWeek.MONDAY,
  Tue: DayOfWeek.TUESDAY,
  Wed: DayOfWeek.WEDNESDAY,
  Thu: DayOfWeek.THURSDAY,
  Fri: DayOfWeek.FRIDAY,
  Sat: DayOfWeek.SATURDAY,
};

interface ExecutionStateResult {
  executionState: ClassExecutionState;
  ondemandStatus: OnDemandStatus | null;
}

/**
 * Computes the scheduled start time for a given date using the schedule's IANA
 * timezone, so the hour/minute correspond to the wall-clock time in the student's
 * timezone rather than the server's local timezone (RC2-1).
 *
 * Returns a `Date` in UTC that represents the instant at which the given
 * `startHour:startMin` occurs on `currentDate` in `ianaTimezone`.
 */
function computeStartAtInTimezone(currentDate: Date, startHour: number, startMin: number, ianaTimezone: string): Date {
  // Extract the date components using the schedule's IANA timezone via Intl.
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(currentDate);

  const getPart = (type: string): string => dateParts.find(p => p.type === type)?.value ?? "";

  const year = Number(getPart("year"));
  const month = Number(getPart("month")) - 1; // JS months are 0-based
  const day = Number(getPart("day"));

  // Build a UTC timestamp from the wall-clock time and resolve it back to the
  // correct instant using Intl's timezone offset.
  // (UTC equivalent of YYYY-MM-DDTHH:MM:00 in ianaTimezone)
  const asIfUtc = Date.UTC(year, month, day, startHour, startMin, 0, 0);

  // Calculate the offset between the IANA timezone and UTC at this instant.
  const tzParts = new Intl.DateTimeFormat("en-US", {
    timeZone: ianaTimezone,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date(asIfUtc));

  const offsetStr = tzParts.find(p => p.type === "timeZoneName")?.value ?? "+0";
  // Parse offset strings like "GMT+5", "GMT-3:30", "GMT" (UTC)
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(offsetStr);
  const sign = match?.[1] === "-" ? -1 : 1;
  const hours = match ? Number(match[2]) : 0;
  const minutes = match?.[3] ? Number(match[3]) : 0;
  const offsetMinutes = sign * (hours * 60 + minutes);

  // Shift the as-if-UTC timestamp by the offset to get the true UTC instant.
  return new Date(asIfUtc - offsetMinutes * 60 * 1000);
}

function determineExecutionState(isAvailable: boolean, hasBalance: boolean): ExecutionStateResult {
  if (isAvailable && hasBalance) {
    return { executionState: ClassExecutionState.NOT_ACTIVATED, ondemandStatus: OnDemandStatus.AVAILABLE };
  }
  if (!hasBalance) {
    return {
      executionState: ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
      ondemandStatus: OnDemandStatus.PENDING_CREDIT,
    };
  }
  return { executionState: ClassExecutionState.ON_DEMAND_CONFLICT_HELD, ondemandStatus: null };
}

/** A class instance prepared for batch insertion. */
interface PendingInstance {
  recurringScheduleId: string;
  studentId: string;
  teacherId: string;
  subjectId: string | null;
  durationMinutes: number | null;
  bookingTimezone: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  executionState: ClassExecutionState;
  ondemandStatus: OnDemandStatus | null;
  schedulingMode: SchedulingMode;
  idempotencyKey: string;
}

export async function runOndemandInstanceGenerator(): Promise<void> {
  logger.info("[OnDemandInstanceGenerator] Starting on-demand instance generation...");

  try {
    const schedules = await db
      .select()
      .from(recurringSchedules)
      .where(and(eq(recurringSchedules.schedulingMode, SchedulingMode.ON_DEMAND), isNull(recurringSchedules.deletedAt)))
      .limit(MAX_SCHEDULES_PER_RUN);

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
  pendingInstances: PendingInstance[]
): Promise<{ generated: boolean; remaining: number }> {
  const [startHour, startMin] = matchingDay.startTime.split(":").map(Number);
  // RC2-1: Compute start time in the schedule's IANA timezone, not server-local.
  const scheduledStartAt = computeStartAtInTimezone(currentDate, startHour, startMin, schedule.timezone);

  const scheduledEndAt = new Date(scheduledStartAt.getTime() + schedule.durationMinutes * 60 * 1000);

  // Check if this exact slot already has a conflicting instance (quick in-memory reject)
  const tsIso = scheduledStartAt.toISOString();
  const slotKey = `${schedule.id}-${tsIso}`;
  let isAvailable = !existingConflicts.has(slotKey);

  // Use AvailabilityService for teacher availability + conflict checks (Task 14 requirement).
  // Falls back to the service which validates teacher availability windows, vacations, and
  // overlapping instances via SchedulingRepository + TeacherAvailabilityRepository.
  if (isAvailable) {
    isAvailable = await AvailabilityService.isSlotAvailable({
      studentId: schedule.studentId,
      teacherId: schedule.teacherId,
      startAt: scheduledStartAt,
      endAt: scheduledEndAt,
      ignoreInstanceIds: [],
      locale: "en",
    });
  }

  const { executionState, ondemandStatus } = determineExecutionState(isAvailable, remainingBalance > 0);

  const dateIso = scheduledStartAt.toISOString().split("T")[0];
  // V3-009: Use IANA-aware day-of-week for the idempotency key so DST
  // transitions in the timezone don't cause key collisions/misses.
  const idempotencyDow = (() => {
    const df = new Intl.DateTimeFormat("en-US", { timeZone: schedule.timezone, weekday: "short" });
    return SHORT_WEEKDAY_TO_ENUM[df.format(currentDate)] ?? currentDate.getDay();
  })();
  const idempotencyKey = `recurring-${schedule.id}-${idempotencyDow}-${dateIso}`;

  pendingInstances.push({
    recurringScheduleId: schedule.id,
    studentId: schedule.studentId,
    teacherId: schedule.teacherId,
    subjectId: schedule.subjectId,
    durationMinutes: schedule.durationMinutes,
    bookingTimezone: schedule.timezone,
    scheduledStartAt,
    scheduledEndAt,
    executionState,
    ondemandStatus,
    schedulingMode: SchedulingMode.ON_DEMAND,
    idempotencyKey,
  });

  const newRemaining =
    String(executionState) === String(ClassExecutionState.NOT_ACTIVATED) ? remainingBalance - 1 : remainingBalance;
  return { generated: true, remaining: newRemaining };
}

interface ScheduleDateRange {
  startDate: Date;
  scheduleEndDate: Date;
}

/** Computes the effective date range for instance generation based on schedule metadata. */
function computeScheduleDateRange(schedule: typeof recurringSchedules.$inferSelect, now: Date): ScheduleDateRange {
  const horizonWeeks = schedule.generationHorizonWeeks ?? 2;
  const effectiveFromDate = schedule.effectiveFrom ? new Date(schedule.effectiveFrom) : now;
  const startDate = effectiveFromDate > now ? effectiveFromDate : now;
  const horizonEndDate = new Date(startDate.getTime() + horizonWeeks * 7 * 24 * 60 * 60 * 1000);
  const effectiveUntilDate = schedule.effectiveUntil ? new Date(schedule.effectiveUntil) : null;
  const scheduleEndDate =
    effectiveUntilDate && effectiveUntilDate < horizonEndDate ? effectiveUntilDate : horizonEndDate;
  return { startDate, scheduleEndDate };
}

/** Queries for any existing class instances that overlap with the generation window. */
function buildOverlappingInstancesQuery(
  schedule: typeof recurringSchedules.$inferSelect,
  startDate: Date,
  scheduleEndDate: Date
) {
  return db
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
    )
    .limit(MAX_OVERLAPPING_INSTANCES_PER_SCHEDULE);
}

/** Builds a Set of timestamp-based slot keys that are already taken by existing instances. */
function buildExistingConflictSet(scheduleId: string, overlappingInstances: { scheduledStartAt: Date }[]): Set<string> {
  const existingConflicts = new Set<string>();
  for (const inst of overlappingInstances) {
    existingConflicts.add(`${scheduleId}-${inst.scheduledStartAt.toISOString()}`);
  }
  return existingConflicts;
}

/** Resolves the IANA-timezone-aware day-of-week for the current iteration date. */
function resolveScheduleDOW(currentDate: Date, timezone: string): DayOfWeek | undefined {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" });
  const weekdayShort = fmt.format(currentDate);
  return SHORT_WEEKDAY_TO_ENUM[weekdayShort];
}

/** Iterates through the date range, generating pending instances for each matching schedule day. */
async function generatePendingInstancesForRange(
  schedule: typeof recurringSchedules.$inferSelect,
  scheduleDays: (typeof recurringScheduleDays.$inferSelect)[],
  startDate: Date,
  scheduleEndDate: Date,
  remainingBalance: number,
  existingConflicts: Set<string>
): Promise<{ pendingInstances: PendingInstance[]; finalBalance: number }> {
  const pendingInstances: PendingInstance[] = [];
  let currentBalance = remainingBalance;
  const currentDate = new Date(startDate);

  while (currentDate <= scheduleEndDate) {
    const scheduleDOW = resolveScheduleDOW(currentDate, schedule.timezone);
    const matchingDay = scheduleDOW ? scheduleDays.find(d => String(d.dayOfWeek) === String(scheduleDOW)) : undefined;

    if (matchingDay) {
      const result = await tryGenerateSlotDay(
        schedule,
        currentDate,
        matchingDay,
        currentBalance,
        existingConflicts,
        pendingInstances
      );
      if (result.generated) {
        currentBalance = result.remaining;
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { pendingInstances, finalBalance: currentBalance };
}

/** Maps a PendingInstance to the insert shape expected by the classInstances table. */
function toClassInstanceInsertType(p: PendingInstance): ClassInstanceInsertType {
  return {
    recurringScheduleId: p.recurringScheduleId,
    studentId: p.studentId,
    teacherId: p.teacherId,
    subjectId: p.subjectId,
    durationMinutes: p.durationMinutes,
    classType: ClassType.REGULAR,
    bookingTimezone: p.bookingTimezone,
    scheduledStartAt: p.scheduledStartAt,
    scheduledEndAt: p.scheduledEndAt,
    executionState: p.executionState,
    ondemandStatus: p.ondemandStatus,
    schedulingMode: p.schedulingMode,
    quotaDeducted: false,
    idempotencyKey: p.idempotencyKey,
  } as ClassInstanceInsertType;
}

async function generateInstancesForSchedule(
  schedule: typeof recurringSchedules.$inferSelect,
  now: Date
): Promise<number> {
  const { startDate, scheduleEndDate } = computeScheduleDateRange(schedule, now);

  // RP2-1: Parallelise 2 independent read-only guards (schedule days,
  // overlapping instances) that were previously sequential awaits.
  // We query these outside the tx because they are read-only guards — an
  // empty schedule-days result lets us short-circuit before acquiring a tx.
  const [scheduleDays, overlappingInstances] = await Promise.all([
    db
      .select()
      .from(recurringScheduleDays)
      .where(and(eq(recurringScheduleDays.recurringScheduleId, schedule.id), eq(recurringScheduleDays.isActive, true))),
    buildOverlappingInstancesQuery(schedule, startDate, scheduleEndDate),
  ]);

  if (scheduleDays.length === 0) return 0;

  // RBL2-3: Balance read + decrement + instance insert run inside a single
  // transaction with SELECT FOR UPDATE on the student's active quotas so
  // concurrent generator runs cannot oversell instances via concurrent
  // in-memory decrements.
  const generated = await db.transaction(async tx => {
    const [creditBalance, activeQuotas] = await Promise.all([
      CreditRepository.getBalance(tx, schedule.studentId),
      tx
        .select()
        .from(quotas)
        .where(
          and(eq(quotas.studentId, schedule.studentId), eq(quotas.status, QuotaStatus.ACTIVE), isNull(quotas.deletedAt))
        )
        .for("update"),
    ]);

    const totalQuotaRemaining = activeQuotas.reduce((sum, q) => sum + q.remaining, 0);
    // NOTE: Mirrors QuotaService.refreshStudentOndemandInstances credit computation — keep in sync
    const availableBalance = creditBalance.classesRemaining + totalQuotaRemaining;

    // Verify-6: Only generate instances when the student has combined available
    // balance from credits and quotas. Quotas ARE purchased classes — students
    // with only quota balance (no credit balance) must still get instances.
    if (availableBalance <= 0) {
      logger.debug(
        `[OnDemandInstanceGenerator] Skipping schedule ${schedule.id} for student ${schedule.studentId} — no available balance (classesRemaining=${creditBalance.classesRemaining}, quotaRemaining=${totalQuotaRemaining}).`
      );
      return 0;
    }

    const existingConflicts = buildExistingConflictSet(schedule.id, overlappingInstances);

    const { pendingInstances } = await generatePendingInstancesForRange(
      schedule,
      scheduleDays,
      startDate,
      scheduleEndDate,
      availableBalance,
      existingConflicts
    );

    // Insert pending instances inside the same transaction and lock the
    // student's existing on-demand instances so concurrent runs serialize.
    if (pendingInstances.length === 0) return 0;

    // Lock the student's existing on-demand instances for the duration of
    // this tx so concurrent runs cannot both read the same balance and
    // double-insert based on stale `availableBalance`.
    await tx
      .select({ id: classInstances.id })
      .from(classInstances)
      .where(
        and(
          eq(classInstances.studentId, schedule.studentId),
          eq(classInstances.schedulingMode, SchedulingMode.ON_DEMAND),
          isNull(classInstances.deletedAt)
        )
      )
      .for("update");

    const inserted = await tx
      .insert(classInstances)
      .values(pendingInstances.map(toClassInstanceInsertType))
      .onConflictDoNothing()
      .returning({ id: classInstances.id });

    return inserted.length;
  });

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
