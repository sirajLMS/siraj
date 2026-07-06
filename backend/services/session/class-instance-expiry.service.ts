import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import logger from "@/backend/lib/logger";
import { DEFAULT_MISSED_GRACE_MINUTES } from "@/shared/lib/schedule-instance-dashboard-status";

const DEFAULT_BATCH_SIZE = 50;

export namespace ClassInstanceExpiryService {
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

    let processedCount = 0;
    for (const row of expiredRows) {
      try {
        const updated = await SchedulingRepository.markClassMissedBySystem(row.id, undefined, options?.locale);
        if (updated) {
          processedCount += 1;
        }
      } catch (error) {
        logger.error("Failed to auto-mark missed class instance", {
          classInstanceId: row.id,
          error,
        });
      }
    }

    if (processedCount > 0) {
      logger.info("Auto-marked missed class instances", { processedCount });
    }

    return processedCount;
  }
}
