import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { classInstances, parents, recurringSchedules, students, systemSettings } from "@/backend/db/schema";
import {
  ClassExecutionState,
  OnDemandStatus,
  SchedulingMode,
  SystemSettingCategory,
  SystemSettingDataType,
} from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { QuotaNotificationService } from "@/backend/services/billing/quota-notification.service";

/** Days before a scheduled on-demand class to send the T-3 reminder. */
const T3_DAYS = 3;
/** Days before a scheduled on-demand class to send the T-1 reminder. */
const T1_DAYS = 1;

/** Half-day window (hours) — matches twice-daily cron cadence so we don't miss/double-send. */
const WINDOW_HOURS = 12;

interface ReminderCandidate {
  instanceId: string;
  studentId: string;
  studentName: string;
  affectedUserIds: string[];
  scheduledStartAt: string;
  reminderKey: string;
}

/**
 * Cron entry point: sends T-3 and T-1 reminder notifications for on-demand
 * class instances that are scheduled within those lead windows.
 *
 * Designed to run once or twice per day. Each candidate includes a per-instance
 * idempotency flag (`reminderKey`) stored as a `systemSettings` marker so
 * re-runs within the same UTC day are safe and de-duplicated.
 */
export async function runQuotaReminderCron(): Promise<void> {
  logger.info("[QuotaReminderCron] Starting on-demand reminder dispatch...");

  try {
    const now = new Date();
    const windowMs = WINDOW_HOURS * 60 * 60 * 1000;

    const t3Start = new Date(now.getTime() + T3_DAYS * 24 * 60 * 60 * 1000 - windowMs);
    const t3End = new Date(now.getTime() + T3_DAYS * 24 * 60 * 60 * 1000 + windowMs);
    const t1Start = new Date(now.getTime() + T1_DAYS * 24 * 60 * 60 * 1000 - windowMs);
    const t1End = new Date(now.getTime() + T1_DAYS * 24 * 60 * 60 * 1000 + windowMs);

    const [t3Candidates, t1Candidates] = await Promise.all([
      fetchReminderCandidates(t3Start, t3End, "t3"),
      fetchReminderCandidates(t1Start, t1End, "t1"),
    ]);

    logger.info(
      `[QuotaReminderCron] Found ${t3Candidates.length} T-3 and ${t1Candidates.length} T-1 reminder candidates.`
    );

    let t3Sent = 0;
    let t1Sent = 0;

    for (const candidate of t3Candidates) {
      const alreadySent = await checkAndMarkReminderSent(candidate.reminderKey);
      if (alreadySent) continue;

      if (candidate.affectedUserIds.length === 0) {
        logger.warn(
          `[QuotaReminderCron] Skipping instance ${candidate.instanceId} — no resolvable parent/guardian userId.`
        );
        continue;
      }

      await QuotaNotificationService.sendOndemandInstanceReminderT3({
        affectedUserIds: candidate.affectedUserIds,
        studentName: candidate.studentName,
        scheduledStartAt: candidate.scheduledStartAt,
      });
      t3Sent++;
    }

    for (const candidate of t1Candidates) {
      const alreadySent = await checkAndMarkReminderSent(candidate.reminderKey);
      if (alreadySent) continue;

      if (candidate.affectedUserIds.length === 0) {
        logger.warn(
          `[QuotaReminderCron] Skipping instance ${candidate.instanceId} — no resolvable parent/guardian userId.`
        );
        continue;
      }

      await QuotaNotificationService.sendOndemandInstanceReminderT1({
        affectedUserIds: candidate.affectedUserIds,
        studentName: candidate.studentName,
        scheduledStartAt: candidate.scheduledStartAt,
      });
      t1Sent++;
    }

    logger.info(`[QuotaReminderCron] Sent ${t3Sent} T-3 and ${t1Sent} T-1 reminders.`);
  } catch (error) {
    logger.error("[QuotaReminderCron] Error running quota reminder cron:", { error });
    throw error;
  }
}

/**
 * Queries for on-demand class instances scheduled within the given time window,
 * then resolves the student's name and parent's userId for notification dispatch.
 * Only instances in `NOT_ACTIVATED` execution state with `AVAILABLE` on-demand
 * status are considered — `PENDING_CREDIT` instances have no class to remind about.
 */
async function fetchReminderCandidates(
  windowStart: Date,
  windowEnd: Date,
  tier: "t3" | "t1"
): Promise<ReminderCandidate[]> {
  // 1. Fetch matching on-demand instances.
  const instances = await db
    .select({
      instance: classInstances,
    })
    .from(classInstances)
    .innerJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
    .where(
      and(
        eq(recurringSchedules.schedulingMode, SchedulingMode.ON_DEMAND),
        eq(classInstances.executionState, ClassExecutionState.NOT_ACTIVATED),
        eq(classInstances.ondemandStatus, OnDemandStatus.AVAILABLE),
        isNull(classInstances.deletedAt),
        sql`${classInstances.scheduledStartAt} >= ${windowStart.toISOString()}`,
        sql`${classInstances.scheduledStartAt} <= ${windowEnd.toISOString()}`
      )
    );

  if (instances.length === 0) return [];

  // 2. Resolve student → parent userId for notification recipients.
  const studentIds = [...new Set(instances.map(r => r.instance.studentId))];

  const studentRows = await db
    .select({
      studentId: students.id,
      studentName: students.name,
      parentId: students.parentId,
      studentUserId: students.userId,
    })
    .from(students)
    .where(inArray(students.id, studentIds));

  let parentUserMap = new Map<string, string>();
  const validParents = studentRows.filter(s => s.parentId !== null);
  if (validParents.length > 0) {
    const parentIds = [...new Set(validParents.map(s => s.parentId as string))];
    const parentRows = await db
      .select({ parentId: parents.id, userId: parents.userId })
      .from(parents)
      .where(inArray(parents.id, parentIds));
    parentUserMap = new Map(parentRows.map(p => [p.parentId, p.userId]));
  }

  // 3. Build candidates with idempotency keys keyed by tier + date + instance.
  const dateStr = new Date().toISOString().slice(0, 10);
  // Key format: odr_{tier}_{date}_{instanceId} — stays well under 100 chars.
  const reminderKeyPrefix = `odr_${tier}_${dateStr}`;

  return instances
    .map(({ instance }) => {
      const studentRow = studentRows.find(s => s.studentId === instance.studentId);
      if (!studentRow) return null;

      // Prefer parent's userId; fall back to student's own userId (self-funded).
      const parentUserId = studentRow.parentId ? (parentUserMap.get(studentRow.parentId) ?? null) : null;
      const affectedUserIds: string[] = parentUserId ? [parentUserId] : [studentRow.studentUserId];

      return {
        instanceId: instance.id,
        studentId: instance.studentId,
        studentName: studentRow.studentName,
        affectedUserIds,
        scheduledStartAt: instance.scheduledStartAt.toISOString(),
        reminderKey: `${reminderKeyPrefix}_${instance.id}`,
      } satisfies ReminderCandidate;
    })
    .filter((c): c is ReminderCandidate => c !== null);
}

/**
 * Atomically claims a reminder slot via an idempotency marker stored in
 * `systemSettings`. Returns `true` if a marker already existed (already sent),
 * `false` if this invocation claimed the slot.
 *
 * Uses `ON CONFLICT DO NOTHING` + `RETURNING` to eliminate the TOCTOU race —
 * if the insert returns no rows, a concurrent invocation already sent it.
 */
async function checkAndMarkReminderSent(reminderKey: string): Promise<boolean> {
  const nowIso = new Date();
  const inserted = await db
    .insert(systemSettings)
    .values({
      key: reminderKey,
      value: nowIso.toISOString(),
      dataType: SystemSettingDataType.String,
      description: "On-demand reminder sent marker (auto-generated)",
      category: SystemSettingCategory.Scheduling,
      updatedAt: nowIso,
    })
    .onConflictDoNothing()
    .returning();

  return inserted.length === 0;
}

if (import.meta.main) {
  runQuotaReminderCron()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
