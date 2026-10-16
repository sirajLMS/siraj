import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  classInstances,
  recurringSchedules,
  systemSettings,
  teacherAvailabilityWindows,
  users,
} from "@/backend/db/schema";

import { OnDemandStatus, SchedulingMode } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { QuotaNotificationService } from "@/backend/services";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

/** Maximum number of pending instances to process per digest run (unbounded SELECT guard). */
const MAX_DIGEST_INSTANCES_PER_RUN = 500;

interface TeacherDigestInfo {
  count: number;
  timezone: string;
  scheduleTimezone: string | null;
}

/** Reads the configured digest hour from system_settings, defaulting to 9 AM. */
async function resolveDigestHour(settingRow: { value: string }[]): Promise<number | null> {
  const targetHour = settingRow.length > 0 ? Number.parseInt(settingRow[0].value, 10) : 9;
  if (Number.isNaN(targetHour)) {
    logger.warn("[OnDemandTeacherDigestCron] Invalid hour setting, skipping");
    return null;
  }
  return targetHour;
}

/** Builds a set of pending on-demand instances joined with their schedules. */
async function fetchPendingInstances() {
  return db
    .select({
      instance: classInstances,
      schedule: recurringSchedules,
    })
    .from(classInstances)
    .innerJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
    .where(
      and(
        eq(recurringSchedules.schedulingMode, SchedulingMode.ON_DEMAND),
        eq(classInstances.ondemandStatus, OnDemandStatus.PENDING_CREDIT),
        isNull(classInstances.deletedAt)
      )
    )
    .limit(MAX_DIGEST_INSTANCES_PER_RUN);
}

/** Groups pending instances by teacher, tracking count and schedule timezone. */
function groupInstancesByTeacher(
  pendingInstances: { instance: typeof classInstances.$inferSelect; schedule: typeof recurringSchedules.$inferSelect }[]
): Map<string, TeacherDigestInfo> {
  const teacherMap = new Map<string, TeacherDigestInfo>();

  for (const { instance, schedule } of pendingInstances) {
    const teacherId = instance.teacherId;
    const scheduleTz = schedule.timezone ?? null;

    const existing = teacherMap.get(teacherId);
    if (existing) {
      existing.count += 1;
    } else {
      teacherMap.set(teacherId, { count: 1, timezone: scheduleTz ?? "UTC", scheduleTimezone: scheduleTz });
    }
  }

  return teacherMap;
}

/**
 * V3-Verify-6: Batch-fetches teacher_availability_windows timezones so we can
 * fall back to them when the schedule has no timezone. Fallback chain:
 * schedule.timezone → teacher_availability_windows.timezone → "UTC".
 */
async function resolveMissingTimezones(teacherMap: Map<string, TeacherDigestInfo>): Promise<void> {
  const teacherIdsWithMissingTz = [...teacherMap.entries()]
    .filter(([, info]) => info.scheduleTimezone === null)
    .map(([teacherId]) => teacherId);

  if (teacherIdsWithMissingTz.length === 0) return;

  const availWindows = await db
    .select({
      teacherId: teacherAvailabilityWindows.teacherId,
      timezone: teacherAvailabilityWindows.timezone,
    })
    .from(teacherAvailabilityWindows)
    .where(inArray(teacherAvailabilityWindows.teacherId, teacherIdsWithMissingTz));

  // First window per teacher is sufficient as a timezone source.
  const teacherAvailTzMap = new Map<string, string>();
  for (const w of availWindows) {
    if (!teacherAvailTzMap.has(w.teacherId)) {
      teacherAvailTzMap.set(w.teacherId, w.timezone);
    }
  }

  for (const teacherId of teacherIdsWithMissingTz) {
    const info = teacherMap.get(teacherId);
    if (!info) continue;
    info.timezone = teacherAvailTzMap.get(teacherId) ?? "UTC";
  }
}

/** Batch-fetches teacher user records and returns a name lookup map. */
async function buildTeacherNameMap(teacherIds: string[]): Promise<Map<string, string>> {
  const teacherUsers = await db.select().from(users).where(inArray(users.id, teacherIds));
  return new Map(teacherUsers.map(u => [u.id, u.name]));
}

/**
 * Cache of `Intl.DateTimeFormat` instances keyed by IANA timezone ID.
 * Avoids heavy V8 ICU initialization overhead during per-teacher cron runs.
 */
const hourDtfCache = new Map<string, Intl.DateTimeFormat>();

function getHourDtf(timezone: string): Intl.DateTimeFormat {
  let dtf = hourDtfCache.get(timezone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    });
    hourDtfCache.set(timezone, dtf);
  }
  return dtf;
}

/** Resolves the current local hour in the teacher's timezone using cached Intl.DateTimeFormat. */
function resolveLocalHour(nowUtc: Date, timezone: string): number {
  const localHourStr = getHourDtf(timezone).format(nowUtc);
  return Number.parseInt(localHourStr, 10) % 24;
}

/**
 * Per-teacher idempotency marker: atomic conditional insert with RETURNING
 * eliminates the TOCTOU race. If the INSERT returns a row, this invocation
 * won the race and should send the digest. If it returns nothing, a
 * concurrent invocation already sent it.
 */
async function tryInsertIdempotencyMarker(dateHourStr: string, teacherId: string, nowUtc: Date): Promise<boolean> {
  const teacherIdempotencyKey = `ondemand_teacher_digest_sent_${dateHourStr}_${teacherId}`;
  const inserted = await db
    .insert(systemSettings)
    .values({
      key: teacherIdempotencyKey,
      value: nowUtc.toISOString(),
      dataType: SystemSettingDataType.String,
      description: "On-demand teacher digest sent marker (auto-generated)",
      category: SystemSettingCategory.Scheduling,
      updatedAt: nowUtc,
    })
    .onConflictDoNothing()
    .returning();
  return inserted.length > 0;
}

/** Sends the digest to a teacher if their local hour matches the target hour and they haven't been sent to yet. */
async function maybeSendTeacherDigest(
  teacherId: string,
  info: TeacherDigestInfo,
  targetHour: number,
  dateHourStr: string,
  nowUtc: Date,
  teacherNameMap: Map<string, string>
): Promise<boolean> {
  try {
    const currentLocalHour = resolveLocalHour(nowUtc, info.timezone);

    if (currentLocalHour !== targetHour) return false;

    const wonRace = await tryInsertIdempotencyMarker(dateHourStr, teacherId, nowUtc);
    if (!wonRace) return false;

    const teacherName = teacherNameMap.get(teacherId) ?? "Teacher";

    await QuotaNotificationService.sendOndemandTeacherDailyDigest({
      affectedUserIds: [teacherId],
      teacherName,
      pendingCount: info.count,
    });

    return true;
  } catch (err) {
    logger.warn(`[OnDemandTeacherDigestCron] Timezone check failed for timezone: ${info.timezone}`, { err });
    return false;
  }
}

export async function runOndemandTeacherDigestCron(): Promise<void> {
  logger.info("[OnDemandTeacherDigestCron] Starting teacher daily digest check...");

  try {
    // 1. Read configured digest hour setting (default 9 AM)
    const settingRow = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "ondemand_teacher_digest_hour"))
      .limit(1);

    const targetHour = await resolveDigestHour(settingRow);
    if (targetHour === null) return;

    const nowUtc = new Date();

    // 1b. Idempotency check: per-teacher markers prevent re-sending to the
    // same teacher within the same UTC date + target hour. The read-then-write
    // race is resolved by using ON CONFLICT DO NOTHING on the unique key column,
    // making each insert atomic and idempotent.
    // PERF-10: N+1 systemSettings reads — could be cached as a single inArray query.
    // Currently one systemSettings query per run (above) plus per-teacher idempotency
    // inserts below accumulate rows; consider caching the digest-hour setting.
    const dateHourStr = `${nowUtc.toISOString().slice(0, 10)}_${targetHour}`;

    // 2. Fetch pending instances grouped by teacher
    const pendingInstances = await fetchPendingInstances();

    if (pendingInstances.length === 0) {
      logger.info("[OnDemandTeacherDigestCron] No pending on-demand instances found.");
      return;
    }

    const teacherMap = groupInstancesByTeacher(pendingInstances);
    await resolveMissingTimezones(teacherMap);

    // Batch-fetch all teacher user records
    const teacherNameMap = await buildTeacherNameMap([...teacherMap.keys()]);

    const sendResults = await Promise.all(
      [...teacherMap.entries()].map(([teacherId, info]) =>
        maybeSendTeacherDigest(teacherId, info, targetHour, dateHourStr, nowUtc, teacherNameMap)
      )
    );
    const sentCount = sendResults.filter(Boolean).length;

    logger.info(`[OnDemandTeacherDigestCron] Sent ${sentCount} digests.`);
  } catch (error) {
    logger.error("[OnDemandTeacherDigestCron] Error running teacher digest cron:", { error });
    throw error;
  }
}

if (import.meta.main) {
  runOndemandTeacherDigestCron()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
