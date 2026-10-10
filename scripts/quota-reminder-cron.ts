import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db";
import { classInstances, recurringSchedules, systemSettings } from "@/backend/db/schema";
import { OnDemandStatus, SchedulingMode } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { QuotaNotificationService } from "@/backend/services";
import { resolveStudentNotificationRecipients } from "@/scripts/lib/resolve-notification-recipients";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

/** Days before a scheduled on-demand class to send the T-3 reminder. */
const T3_DAYS = 3;
/** Days before a scheduled on-demand class to send the T-1 reminder. */
const T1_DAYS = 1;

/** Half-day window (hours) — matches twice-daily cron cadence so we don't miss/double-send. */
const WINDOW_HOURS = 12;

/** Maximum number of reminder candidates to fetch per window (unbounded SELECT guard). */
const MAX_REMINDER_CANDIDATES_PER_WINDOW = 500;

/**
 * Module-level cache for `Intl.DateTimeFormat` instance.
 * Instantiating `Intl.DateTimeFormat` inside loop bodies or functions called per-window
 * generates unnecessary CPU and GC overhead.
 */
const utcDateDtf = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

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
    const { t3Candidates, t1Candidates } = await fetchAllCandidates();
    logger.info(
      `[QuotaReminderCron] Found ${t3Candidates.length} T-3 and ${t1Candidates.length} T-1 reminder candidates.`
    );
    const alreadySentKeys = await loadAlreadySentKeys(t3Candidates, t1Candidates);
    const { t3Sent, t1Sent, allDispatchedKeys } = await dispatchReminders(t3Candidates, t1Candidates, alreadySentKeys);
    await persistIdempotencyMarkers(allDispatchedKeys);
    logger.info(`[QuotaReminderCron] Sent ${t3Sent} T-3 and ${t1Sent} T-1 reminders.`);
  } catch (error) {
    logger.error("[QuotaReminderCron] Error running quota reminder cron:", { error });
    throw error;
  }
}

async function fetchAllCandidates(): Promise<{
  t3Candidates: ReminderCandidate[];
  t1Candidates: ReminderCandidate[];
}> {
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
  return { t3Candidates, t1Candidates };
}

async function loadAlreadySentKeys(
  t3Candidates: ReminderCandidate[],
  t1Candidates: ReminderCandidate[]
): Promise<Set<string>> {
  const allCandidateKeys = [...t3Candidates, ...t1Candidates].map(c => c.reminderKey);
  const alreadySentKeys = new Set<string>();
  if (allCandidateKeys.length > 0) {
    const sentRows = await db
      .select({ key: systemSettings.key })
      .from(systemSettings)
      .where(inArray(systemSettings.key, allCandidateKeys));
    for (const row of sentRows) {
      alreadySentKeys.add(row.key);
    }
  }
  return alreadySentKeys;
}

async function dispatchReminders(
  t3Candidates: ReminderCandidate[],
  t1Candidates: ReminderCandidate[],
  alreadySentKeys: Set<string>
): Promise<{ t3Sent: number; t1Sent: number; allDispatchedKeys: string[] }> {
  const t3DispatchedKeys: string[] = [];
  const t1DispatchedKeys: string[] = [];
  const t3ToDispatch = t3Candidates.filter(c => !alreadySentKeys.has(c.reminderKey) && c.affectedUserIds.length > 0);
  const t3Skipped = t3Candidates.filter(c => c.affectedUserIds.length === 0);
  for (const s of t3Skipped) {
    logger.warn(`[QuotaReminderCron] Skipping instance ${s.instanceId} — no resolvable parent/guardian userId.`);
  }
  await Promise.all(
    t3ToDispatch.map(async candidate => {
      await QuotaNotificationService.sendOndemandInstanceReminderT3({
        affectedUserIds: candidate.affectedUserIds,
        studentName: candidate.studentName,
        scheduledStartAt: candidate.scheduledStartAt,
      });
      t3DispatchedKeys.push(candidate.reminderKey);
    })
  );
  const t1ToDispatch = t1Candidates.filter(c => !alreadySentKeys.has(c.reminderKey) && c.affectedUserIds.length > 0);
  const t1Skipped = t1Candidates.filter(c => c.affectedUserIds.length === 0);
  for (const s of t1Skipped) {
    logger.warn(`[QuotaReminderCron] Skipping instance ${s.instanceId} — no resolvable parent/guardian userId.`);
  }
  await Promise.all(
    t1ToDispatch.map(async candidate => {
      await QuotaNotificationService.sendOndemandInstanceReminderT1({
        affectedUserIds: candidate.affectedUserIds,
        studentName: candidate.studentName,
        scheduledStartAt: candidate.scheduledStartAt,
      });
      t1DispatchedKeys.push(candidate.reminderKey);
    })
  );
  return {
    t3Sent: t3DispatchedKeys.length,
    t1Sent: t1DispatchedKeys.length,
    allDispatchedKeys: [...t3DispatchedKeys, ...t1DispatchedKeys],
  };
}

async function persistIdempotencyMarkers(allDispatchedKeys: string[]): Promise<void> {
  if (allDispatchedKeys.length > 0) {
    const nowIso = new Date();
    await db
      .insert(systemSettings)
      .values(
        allDispatchedKeys.map(key => ({
          key,
          value: nowIso.toISOString(),
          dataType: SystemSettingDataType.String,
          description: "On-demand reminder sent marker (auto-generated)",
          category: SystemSettingCategory.Scheduling,
          updatedAt: nowIso,
        }))
      )
      .onConflictDoNothing();
  }
}

/**
 * Queries for on-demand class instances scheduled within the given time window,
 * then resolves the student's name and parent's userId for notification dispatch
 * via the shared resolveStudentNotificationRecipients utility.
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
    )
    .limit(MAX_REMINDER_CANDIDATES_PER_WINDOW);

  if (instances.length === 0) return [];

  // 2. Resolve recipients via the shared utility (batch student + parent lookup).
  const studentIds = [...new Set(instances.map(r => r.instance.studentId))];
  const recipientMap = await resolveStudentNotificationRecipients(studentIds);

  // 3. Build candidates with idempotency keys keyed by tier + date + instance.
  // V3-007: Use DST-safe calendar-day construction via Intl.DateTimeFormat so
  // the date string is resolved in UTC (not server-local time), avoiding
  // DST boundaries that could shift the calendar day.
  const dateStr = utcDateDtf
    .format(windowStart)
    .replace(/\//g, "-");

  // Key format: odr_{tier}_{date}_{instanceId} — stays well under 100 chars.
  const reminderKeyPrefix = `odr_${tier}_${dateStr}`;

  return instances
    .map(({ instance }) => {
      const recipient = recipientMap.get(instance.studentId);
      if (!recipient) return null;

      return {
        instanceId: instance.id,
        studentId: instance.studentId,
        studentName: recipient.studentName,
        affectedUserIds: recipient.affectedUserIds,
        scheduledStartAt: instance.scheduledStartAt.toISOString(),
        reminderKey: `${reminderKeyPrefix}_${instance.id}`,
      } satisfies ReminderCandidate;
    })
    .filter((c): c is ReminderCandidate => c !== null);
}

if (import.meta.main) {
  runQuotaReminderCron()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
