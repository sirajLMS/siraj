import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import { DEFAULT_MISSED_GRACE_MINUTES } from "@/shared/lib/schedule/schedule-instance-dashboard-status";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const DEFAULT_BATCH_SIZE = 50;

export namespace ClassInstanceExpiryService {
  /**
   * Fire `CLASS_MARKED_MISSED` to the parent of an auto-marked instance. A
   * separate function (rather than inlined inside the loop) keeps the
   * per-instance try/catch boundary clean for the cognitive-complexity
   * budget and mirrors the per-instance error isolation strategy the expiry
   * loop already uses for `markClassMissedBySystem`.
   */
  async function notifyParentOfMissedInstance(classInstanceId: string, locale?: string): Promise<void> {
    const affected = await SchedulingRepository.getClassInstanceAffectedUsers(classInstanceId);
    if (!affected) return;

    const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
    if (!instance) return;

    const studentName = instance.student?.name ?? "—";
    const payloads = buildClassLifecyclePayloads(
      instance,
      NotificationEventType.CLASS_MARKED_MISSED,
      [affected.parentUserId],
      locale,
      { studentName }
    );
    await dispatchWithPreferences(payloads, [affected.parentUserId], locale);
  }

  export async function processExpiredInstances(options?: {
    now?: Date;
    batchSize?: number;
    locale?: string;
  }): Promise<number> {
    const now = options?.now ?? new Date();
    const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
    const graceMinutes = await SystemSettingsRepository.getIntValue(
      "session_missed_grace_minutes",
      DEFAULT_MISSED_GRACE_MINUTES
    );

    const expiredRows = await SchedulingRepository.findExpiredPendingInstances(graceMinutes, batchSize, now);
    if (expiredRows.length === 0) {
      return 0;
    }

    const locale = options?.locale;

    // Per-instance processing is fully isolated: each instance owns its own
    // try/catch boundaries so one failure never halts the batch or surfaces
    // as a 500 to the cron caller. We collect the per-instance promises and
    // run them in parallel via `Promise.all` instead of awaiting each one
    // sequentially inside a loop.
    const processOne = async (row: { id: string }): Promise<number> => {
      const tErrors: ErrorsLabels = getServerTranslations(locale ?? "ar").errorsTranslations;
      try {
        const updated = await SchedulingRepository.markClassMissedBySystem(row.id, undefined, tErrors);
        if (!updated) {
          return 0;
        }
      } catch (error) {
        logger.error("Failed to auto-mark missed class instance", {
          classInstanceId: row.id,
          error,
        });
        return 0;
      }

      // Per-instance CLASS_MARKED_MISSED dispatch to the parent only (the
      // teacher is not the audience for system-missed notifications per
      // specs.md §5.2). Wrapped in its own try/catch so one notification
      // failure never halts the loop or surfaces as a 500 to the cron
      // caller — the auto-mark itself has ALREADY committed successfully.
      try {
        await notifyParentOfMissedInstance(row.id, locale);
      } catch (error) {
        logger.error("Class marked-missed notification dispatch failed", {
          classInstanceId: row.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return 1;
    };

    const results = await Promise.all(expiredRows.map(row => processOne(row)));
    const processedCount = results.reduce((sum, value) => sum + value, 0);

    if (processedCount > 0) {
      logger.info("Auto-marked missed class instances", { processedCount });
    }

    return processedCount;
  }
}
