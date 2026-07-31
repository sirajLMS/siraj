import { db } from "@/backend/db/drizzleDb";
import { QuotaRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib/logger";
import { QuotaService } from "@/backend/services/billing/quota.service";

export async function runQuotaExpirySweeper(): Promise<void> {
  logger.info("[QuotaExpirySweeper] Starting quota expiry & periodic refresh sweep...");
  try {
    const expiredQuotas = await QuotaService.expireOverdueQuotas();
    logger.info(`[QuotaExpirySweeper] Expired ${expiredQuotas.length} overdue quotas.`);

    await db.transaction(async tx => {
      const periodicQuotas = await QuotaRepository.listPeriodicForRollover(tx);
      for (const quota of periodicQuotas) {
        // QuotaRepository.refreshPeriodic atomically: reads the target, computes
        // the rollover amount from the rich JSONB policy
        // (maxRolloverPercent / accumulationCap), inserts EXPIRE + per-period GRANT
        // ledger entries with idempotency keys, advances periodAnchor past `now`,
        // and updates `remaining` / `usedThisPeriod` with an optimistic-concurrency
        // version check. It no-ops when the current period has not ended, so
        // re-running the sweeper is safe and `listPeriodicForRollover` will not
        // re-select the same quota every cron tick.
        await QuotaRepository.refreshPeriodic(tx, quota.id, null);
      }
    });

    logger.info("[QuotaExpirySweeper] Completed periodic quota refresh sweep.");
  } catch (error) {
    logger.error("[QuotaExpirySweeper] Error running quota expiry sweeper:", { error });
    throw error;
  }
}

if (import.meta.main) {
  runQuotaExpirySweeper()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
