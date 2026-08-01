import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/backend/db";
import { classInstances, recurringSchedules, systemSettings, users } from "@/backend/db/schema";

import { OnDemandStatus, SchedulingMode, SystemSettingCategory, SystemSettingDataType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { QuotaNotificationService } from "@/backend/services/billing/quota-notification.service";

export async function runOndemandTeacherDigestCron(): Promise<void> {
  logger.info("[OnDemandTeacherDigestCron] Starting teacher daily digest check...");

  try {
    // 1. Read configured digest hour setting (default 9 AM)
    const settingRow = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "ondemand_teacher_digest_hour"))
      .limit(1);

    const targetHour = settingRow.length > 0 ? Number.parseInt(settingRow[0].value, 10) : 9;
    const nowUtc = new Date();

    // 1b. Idempotency check: per-teacher markers prevent re-sending to the
    // same teacher within the same UTC date + target hour. The read-then-write
    // race is resolved by using ON CONFLICT DO NOTHING on the unique key column,
    // making each insert atomic and idempotent.
    const dateHourStr = `${nowUtc.toISOString().slice(0, 10)}_${targetHour}`;

    // 2. Fetch pending instances grouped by teacher
    const pendingInstances = await db
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
      );

    if (pendingInstances.length === 0) {
      logger.info("[OnDemandTeacherDigestCron] No pending on-demand instances found.");
      return;
    }

    // Group by teacher
    const teacherMap = new Map<string, { count: number; timezone: string }>();

    for (const { instance, schedule } of pendingInstances) {
      const teacherId = instance.teacherId;
      const tz = schedule.timezone || "UTC";

      const existing = teacherMap.get(teacherId) ?? { count: 0, timezone: tz };
      existing.count += 1;
      teacherMap.set(teacherId, existing);
    }

    // Batch-fetch all teacher user records
    const teacherIds = [...teacherMap.keys()];
    const teacherUsers = await db.select().from(users).where(inArray(users.id, teacherIds));
    const teacherNameMap = new Map(teacherUsers.map(u => [u.id, u.name]));

    let sentCount = 0;

    for (const [teacherId, { count, timezone }] of teacherMap.entries()) {
      // Per-teacher idempotency marker: atomic conditional insert prevents
      // duplicate sends even under concurrent cron invocations.
      const teacherIdempotencyKey = `ondemand_teacher_digest_sent_${dateHourStr}_${teacherId}`;
      const alreadySent = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, teacherIdempotencyKey))
        .limit(1);

      if (alreadySent.length > 0) continue;

      // Check current local hour in teacher's timezone
      try {
        const localHourStr = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: timezone,
        }).format(nowUtc);

        const currentLocalHour = Number.parseInt(localHourStr, 10) % 24;

        if (currentLocalHour === targetHour) {
          const teacherName = teacherNameMap.get(teacherId) ?? "Teacher";

          await QuotaNotificationService.sendOndemandTeacherDailyDigest({
            affectedUserIds: [teacherId],
            teacherName,
            pendingCount: count,
          });

          // Write per-teacher idempotency marker atomically.
          await db
            .insert(systemSettings)
            .values({
              key: teacherIdempotencyKey,
              value: nowUtc.toISOString(),
              dataType: SystemSettingDataType.String,
              description: "On-demand teacher digest sent marker (auto-generated)",
              category: SystemSettingCategory.Scheduling,
              updatedAt: nowUtc,
            })
            .onConflictDoNothing();

          sentCount++;
        }
      } catch (err) {
        logger.warn(`[OnDemandTeacherDigestCron] Timezone check failed for timezone: ${timezone}`, { err });
      }
    }

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
