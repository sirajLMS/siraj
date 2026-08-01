import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/backend/db";
import { classInstances, recurringSchedules, systemSettings, users } from "@/backend/db/schema";

import { ClassExecutionState, OnDemandNoCreditsOutcome, OnDemandStatus } from "@/backend/enum";

import { logger } from "@/backend/lib/logger";
import { QuotaNotificationService } from "@/backend/services/billing/quota-notification.service";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import { getServerTranslations } from "@/shared/locale/server-graphql";

interface PendingNotification {
  studentId: string;
  studentName: string;
  scheduledStartAt: string;
}

export async function runOndemandNoCreditsResolver(): Promise<void> {
  logger.info("[OnDemandNoCreditsResolver] Starting hourly on-demand no-credits resolution...");

  try {
    const tErrors = getServerTranslations("en").errorsTranslations;

    // Collect notification payloads inside the tx, dispatch after commit
    // to avoid holding the transaction open during external notification calls.
    let pendingNotifications: PendingNotification[] = [];

    await db.transaction(async tx => {
      // Read lead minutes setting (default 240)
      const settingRow = await tx
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, "ondemand_no_credits_resolution_lead_minutes"))
        .limit(1);

      const leadMinutes = settingRow.length > 0 ? Number.parseInt(settingRow[0].value, 10) : 240;
      const now = new Date();
      const cutoffTime = new Date(now.getTime() + leadMinutes * 60 * 1000);

      // Find pending credit instances scheduled to start before cutoffTime.
      // FOR UPDATE prevents concurrent resolvers from double-processing
      // the same instances.
      const pendingInstances = await tx
        .select({
          instance: classInstances,
          schedule: recurringSchedules,
        })
        .from(classInstances)
        .innerJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
        .where(
          and(
            eq(classInstances.ondemandStatus, OnDemandStatus.PENDING_CREDIT),
            lte(classInstances.scheduledStartAt, cutoffTime),
            isNull(classInstances.deletedAt)
          )
        )
        .for("update");

      logger.info(`Found ${pendingInstances.length} pending instances within ${leadMinutes}m lead time.`);

      if (pendingInstances.length === 0) {
        logger.info("[OnDemandNoCreditsResolver] No pending instances to resolve.");
        return;
      }

      // Group instances by outcome type for batch updates
      const cancelIds: string[] = [];
      const absentIds: string[] = [];
      const remindInstances: { instanceId: string; studentId: string; scheduledStartAt: string }[] = [];

      for (const { instance, schedule } of pendingInstances) {
        const outcome = schedule.ondemandNoCreditsOutcome ?? OnDemandNoCreditsOutcome.AUTO_CANCEL;

        if (outcome === OnDemandNoCreditsOutcome.AUTO_CANCEL) {
          cancelIds.push(instance.id);
        } else if (outcome === OnDemandNoCreditsOutcome.AUTO_ABSENT_NO_CREDITS) {
          absentIds.push(instance.id);
        } else {
          remindInstances.push({
            instanceId: instance.id,
            studentId: instance.studentId,
            scheduledStartAt: instance.scheduledStartAt.toISOString(),
          });
        }
      }

      // Batch update all cancel outcomes via the service layer
      // (PENDING_CREDIT guard in markNoCreditsBatch provides idempotency)
      const cancelledCount =
        cancelIds.length > 0
          ? await ClassSessionService.markNoCreditsBatch(
              tx,
              cancelIds,
              OnDemandStatus.NO_CREDITS_CANCELLED,
              ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED
            )
          : 0;

      // Batch update all absent outcomes via the service layer
      const absentCount =
        absentIds.length > 0
          ? await ClassSessionService.markNoCreditsBatch(
              tx,
              absentIds,
              OnDemandStatus.NO_CREDITS_ABSENT,
              ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT
            )
          : 0;

      // Collect notification payloads for REMIND_ONLY instances (dispatched after tx commits)
      if (remindInstances.length > 0) {
        const remindStudentIds = [...new Set(remindInstances.map(r => r.studentId))];
        const remindUsers = await tx.select().from(users).where(inArray(users.id, remindStudentIds));
        const nameMap = new Map(remindUsers.map(u => [u.id, u.name]));

        pendingNotifications = remindInstances.map(ri => ({
          studentId: ri.studentId,
          studentName: nameMap.get(ri.studentId) ?? tErrors.studentNameFallback,
          scheduledStartAt: ri.scheduledStartAt,
        }));
      }

      logger.info(
        `[OnDemandNoCreditsResolver] Resolved ${cancelledCount + absentCount} instances (${cancelledCount} cancelled, ${absentCount} absent, ${remindInstances.length} remind-only).`
      );
    });

    // Dispatch notifications AFTER the transaction commits so we don't
    // hold the DB transaction open during external notification calls.
    for (const pn of pendingNotifications) {
      await QuotaNotificationService.sendOndemandInstancePendingCredit({
        affectedUserIds: [pn.studentId],
        studentName: pn.studentName,
        scheduledStartAt: pn.scheduledStartAt,
      });
    }
  } catch (error) {
    logger.error("[OnDemandNoCreditsResolver] Error running on-demand no-credits resolver:", { error });
    throw error;
  }
}

if (import.meta.main) {
  runOndemandNoCreditsResolver()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
