#!/usr/bin/env bun
/**
 * Standalone Cron Worker (v2-polish scaffold) — drains the cron queue outside
 * the ticker route. Calls `runDrainLoop` in an infinite loop with a 1s pause
 * between drains until the process is terminated by a signal.
 *
 * Usage:
 *   bun run scripts/cron-worker.ts
 *
 * Env overrides:
 *   CRON_QUEUE_MAX_BATCH          — max jobs per drain loop (default 25)
 *   CRON_QUEUE_WORKER_CONCURRENCY — jobs fetched per drain cycle when running
 *                                    standalone (overrides CRON_QUEUE_MAX_BATCH;
 *                                    default 1 — sequential in-process for safety)
 *   CRON_QUEUE_WORKER_TIMEOUT     — max worker duration in ms (default 270_000)
 */
import { logger } from "@/backend/lib/logger";
import {
  CRON_DEFAULT_BATCH_SIZE,
  CRON_DEFAULT_WORKER_CONCURRENCY,
  CRON_DEFAULT_WORKER_TIMEOUT_MS,
  parsePositiveInt,
} from "@/backend/services/cron/cron-env";
import { runDrainLoop } from "@/backend/services/cron/cron-worker.runtime";

let running = true;

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    logger.info("cron.worker.script.signal", { signal: sig });
    running = false;
  });
}

async function main(): Promise<void> {
  const maxBatch = parsePositiveInt(process.env.CRON_QUEUE_MAX_BATCH, "CRON_QUEUE_MAX_BATCH", CRON_DEFAULT_BATCH_SIZE);
  const workerConcurrency = parsePositiveInt(
    process.env.CRON_QUEUE_WORKER_CONCURRENCY,
    "CRON_QUEUE_WORKER_CONCURRENCY",
    CRON_DEFAULT_WORKER_CONCURRENCY
  );

  // CRON_QUEUE_WORKER_CONCURRENCY takes precedence: when set, it controls how
  // many jobs the standalone worker fetches per drain cycle (default 1).
  const batchSize = process.env.CRON_QUEUE_WORKER_CONCURRENCY ? workerConcurrency : maxBatch;
  const maxDurationMs = parsePositiveInt(
    process.env.CRON_QUEUE_WORKER_TIMEOUT,
    "CRON_QUEUE_WORKER_TIMEOUT",
    CRON_DEFAULT_WORKER_TIMEOUT_MS
  );

  logger.info("cron.worker.script.start", { batchSize, maxDurationMs, workerConcurrency });

  while (running) {
    const result = await runDrainLoop({ batchSize, maxDurationMs });

    logger.info("cron.worker.script.drain", {
      processed: result.processed,
      failed: result.failed,
      retried: result.retried,
    });

    if (!running) break;
    await Bun.sleep(1000);
  }

  logger.info("cron.worker.script.shutdown", {});
}

main().catch(error => {
  logger.error("cron.worker.script.fatal", { error });
  process.exit(1);
});
