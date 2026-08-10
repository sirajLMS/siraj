import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/backend/db";
import { classInstances, recurringSchedules, systemSettings, users } from "@/backend/db/schema";

import { ClassExecutionState, OnDemandNoCreditsOutcome, OnDemandStatus } from "@/backend/enum";

import { logger } from "@/backend/lib/logger";
import { QuotaNotificationService } from "@/backend/services/billing/quota-notification.service";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/** Maximum number of pending instances to process per resolver run (unbounded SELECT guard). */
const MAX_PENDING_INSTANCES_PER_RUN = 500;

/** Default lead minutes when the setting is missing or invalid. */
const DEFAULT_LEAD_MINUTES = 240;

interface PendingNotification {
  studentId: string;
  studentName: string;
  scheduledStartAt: string;
}

interface RemindInstance {
  instanceId: string;
  studentId: string;
  scheduledStartAt: string;
}

interface ClassifiedInstances {
  cancelIds: string[];
  absentIds: string[];
  remindInstances: RemindInstance[];
}

type SystemSettingsRow = { value: string };
type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Compute effective lead minutes and cutoff time, falling back to the default on invalid values. */
function computeCutoff(settingRow: SystemSettingsRow[]): {
  leadMinutes: number;
  effectiveLeadMinutes: number;
  cutoffTime: Date;
} {
  const leadMinutes = settingRow.length > 0 ? Number.parseInt(settingRow[0].value, 10) : DEFAULT_LEAD_MINUTES;
  // RC2-3: Guard against invalid setting values — if parseInt yields NaN,
  // fall back to the default 240 minutes instead of propagating an Invalid Date.
  const effectiveLeadMinutes = Number.isNaN(leadMinutes) ? DEFAULT_LEAD_MINUTES : leadMinutes;
  const cutoffTime = new Date(Date.now() + effectiveLeadMinutes * 60 * 1000);
  return { leadMinutes, effectiveLeadMinutes, cutoffTime };
}

/** Group pending instances into cancel / absent / remind-only buckets by outcome. */
function classifyInstances(
  pendingInstances: { instance: typeof classInstances.$inferSelect; schedule: typeof recurringSchedules.$inferSelect }[]
): ClassifiedInstances {
  const cancelIds: string[] = [];
  const absentIds: string[] = [];
  const remindInstances: RemindInstance[] = [];

  for (const { instance, schedule } of pendingInstances) {
    const outcome = schedule.ondemandNoCreditsOutcome ?? OnDemandNoCreditsOutcome.AUTO_CANCEL;

    if (outcome === "AUTO_CANCEL") {
      cancelIds.push(instance.id);
    } else if (outcome === "AUTO_ABSENT_NO_CREDITS") {
      absentIds.push(instance.id);
    } else {
      remindInstances.push({
        instanceId: instance.id,
        studentId: instance.studentId,
        scheduledStartAt: instance.scheduledStartAt.toISOString(),
      });
    }
  }

  return { cancelIds, absentIds, remindInstances };
}

/** Apply batch status updates for cancel and absent outcomes via the service layer. */
async function applyBatchStatusUpdates(
  tx: TransactionClient,
  cancelIds: string[],
  absentIds: string[]
): Promise<{ cancelledCount: number; absentCount: number }> {
  // PENDING_CREDIT guard in markNoCreditsBatch provides idempotency
  const cancelledCount =
    cancelIds.length > 0
      ? await ClassSessionService.markNoCreditsBatch(
          tx,
          cancelIds,
          OnDemandStatus.NO_CREDITS_CANCELLED,
          ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED
        )
      : 0;

  const absentCount =
    absentIds.length > 0
      ? await ClassSessionService.markNoCreditsBatch(
          tx,
          absentIds,
          OnDemandStatus.NO_CREDITS_ABSENT,
          ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT
        )
      : 0;

  return { cancelledCount, absentCount };
}

/** Build notification payloads for remind-only instances (dispatched after tx commits). */
async function collectReminderPayloads(
  tx: TransactionClient,
  remindInstances: RemindInstance[],
  studentNameFallback: string
): Promise<PendingNotification[]> {
  const remindStudentIds = [...new Set(remindInstances.map(r => r.studentId))];
  const remindUsers = await tx.select().from(users).where(inArray(users.id, remindStudentIds));
  const nameMap = new Map(remindUsers.map(u => [u.id, u.name]));

  return remindInstances.map(ri => ({
    studentId: ri.studentId,
    studentName: nameMap.get(ri.studentId) ?? studentNameFallback,
    scheduledStartAt: ri.scheduledStartAt,
  }));
}

/** Fan-out quota notifications in parallel after the transaction commits (RP2-2). */
async function dispatchReminderNotifications(pendingNotifications: PendingNotification[]): Promise<void> {
  if (pendingNotifications.length === 0) {
    return;
  }

  await Promise.all(
    pendingNotifications.map(pn =>
      QuotaNotificationService.sendOndemandInstancePendingCredit({
        affectedUserIds: [pn.studentId],
        studentName: pn.studentName,
        scheduledStartAt: pn.scheduledStartAt,
      })
    )
  );
}

/**
 * Inside the transaction: read the lead-minutes setting, find and lock pending instances,
 * classify them, apply batch status updates, and collect remind-only notification payloads.
 */
async function resolvePendingInstances(
  tx: TransactionClient,
  studentNameFallback: string
): Promise<{ pendingNotifications: PendingNotification[] }> {
  const settingRow = await tx
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "ondemand_no_credits_resolution_lead_minutes"))
    .limit(1);

  const { leadMinutes, effectiveLeadMinutes, cutoffTime } = computeCutoff(settingRow);

  // Find pending credit instances scheduled to start before cutoffTime.
  // FOR UPDATE prevents concurrent resolvers from double-processing the same instances.
  // NOTE: Should additionally filter by schedulingMode=ON_DEMAND — the
  // classInstances.schedulingMode column exists and would prevent selecting
  // NUMBER_OF_CLASSES rows that happen to share PENDING_CREDIT ondemandStatus.
  // Currently safe because PENDING_CREDIT is only ever set on ON_DEMAND rows.
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
    .limit(MAX_PENDING_INSTANCES_PER_RUN)
    .for("update");

  logger.info(
    `[OnDemandNoCreditsResolver] Found ${pendingInstances.length} pending instances within ${leadMinutes}m lead time.`
  );

  if (pendingInstances.length === 0) {
    logger.info("[OnDemandNoCreditsResolver] No pending instances to resolve.");
    return { pendingNotifications: [] };
  }

  const { cancelIds, absentIds, remindInstances } = classifyInstances(pendingInstances);
  const { cancelledCount, absentCount } = await applyBatchStatusUpdates(tx, cancelIds, absentIds);
  const pendingNotifications =
    remindInstances.length > 0 ? await collectReminderPayloads(tx, remindInstances, studentNameFallback) : [];

  logger.info(
    `[OnDemandNoCreditsResolver] Resolved ${cancelledCount + absentCount} instances (${cancelledCount} cancelled, ${absentCount} absent, ${remindInstances.length} remind-only).`
  );
  if (leadMinutes !== effectiveLeadMinutes) {
    logger.warn(
      `[OnDemandNoCreditsResolver] Invalid lead_minutes setting "${settingRow[0]?.value}" — fell back to ${DEFAULT_LEAD_MINUTES} minutes.`
    );
  }

  return { pendingNotifications };
}

export async function runOndemandNoCreditsResolver(): Promise<void> {
  logger.info("[OnDemandNoCreditsResolver] Starting hourly on-demand no-credits resolution...");

  try {
    // Collect notification payloads inside the tx, dispatch after commit
    // to avoid holding the transaction open during external notification calls.
    let pendingNotifications: PendingNotification[] = [];
    const tErrors = getServerTranslations("en").errorsTranslations;

    pendingNotifications = (await db.transaction(async tx => resolvePendingInstances(tx, tErrors.studentNameFallback)))
      .pendingNotifications;

    // Dispatch notifications AFTER the transaction commits so we don't
    // hold the DB transaction open during external notification calls.
    await dispatchReminderNotifications(pendingNotifications);
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
