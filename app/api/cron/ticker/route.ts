import { type NextRequest, NextResponse } from "next/server";
import { CronTriggerSource } from "@/backend/enum/cron/cron.enums";
import { withCronAuth } from "@/backend/lib/cron-auth";
import logger from "@/backend/lib/logger";
import { CronService } from "@/backend/services/cron/cron.service";
import { formatError, getCronErrorT } from "@/backend/services/cron/cron-utils";
import { runDrainLoop } from "@/backend/services/cron/cron-worker.runtime";

/**
 * Vercel Cron ticker endpoint — the single heartbeat that drives the entire
 * cron system. Called every minute by Vercel's cron scheduler.
 *
 * Flow:
 *   1. dispatchDueSchedules — finds ACTIVE schedules whose nextRunAt ≤ now,
 *      claims each atomically, enqueues a job via the queue adapter.
 *   2. runDrainLoop — drains the in-process queue (pg-boss default), invokes
 *      the registered handler for each job, writes heartbeats, updates run
 *      status.
 *   3. reconcileStuckRuns — marks RUNNING runs past their timeout as FAILED.
 *
 * Auth: CRON_SECRET bearer (withCronAuth). GET-only.
 * maxDuration: 300s (Vercel Fluid Compute).
 * Must be a numeric literal — Next.js cannot statically analyze imported consts.
 */
export const maxDuration = 300;

export const GET = withCronAuth(async (request: NextRequest) => {
  try {
    const now = new Date();

    // 1. Dispatch due schedules
    const dispatchResult = await CronService.dispatchDueSchedules({
      now,
      source: CronTriggerSource.VERCEL_TICKER,
    });

    // 2. Drain the in-process queue
    const drainResult = await runDrainLoop();

    // 3. Reconcile stuck runs (use fresh timestamp — drain loop may have consumed significant time)
    const stuckRunsReconciled = await CronService.reconcileStuckRuns({ now: new Date() });

    logger.info("cron.ticker.complete", {
      dispatched: dispatchResult.dispatched,
      skipped: dispatchResult.skipped,
      processed: drainResult.processed,
      failed: drainResult.failed,
      retried: drainResult.retried,
      stuckRunsReconciled,
    });

    return NextResponse.json({
      dispatchedCount: dispatchResult.dispatched,
      skippedCount: dispatchResult.skipped,
      processedCount: drainResult.processed,
      failedCount: drainResult.failed,
      retriedCount: drainResult.retried,
      stuckRunsReconciled,
      nextTickInMs: 60_000,
    });
  } catch (error) {
    logger.error("cron.ticker.failed", {
      error: formatError(error),
    });
    const tCron = getCronErrorT(request);
    return NextResponse.json({ error: tCron.tickerFailed }, { status: 500 });
  }
});
