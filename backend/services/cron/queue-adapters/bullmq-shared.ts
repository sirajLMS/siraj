import { logger } from "@/backend/lib/logger";
import { CronQueueBackendNotAvailable } from "@/backend/services/cron/cron.helpers";
import type { CronQueueAdapter } from "@/backend/types";

/**
 * Maximum number of entries retained in closure-scoped Maps before pruning kicks in.
 * Once exceeded, the oldest ~20% are evicted to amortize cost across insertions.
 * Shared by all queue adapters that maintain in-memory job-tracking maps.
 */
const MAP_MAX_SIZE = 10_000;

/**
 * Prune a pair of closure-scoped Maps when the primary map exceeds `MAP_MAX_SIZE`.
 * The oldest ~20% of entries are evicted, matching the original per-adapter strategy.
 *
 * @param mapA   - Primary map whose size triggers pruning (entries are deleted from both maps).
 * @param mapB   - Paired map to prune in sync with `mapA`.
 * @param mapBKeyOf - Extractor: given `mapA`'s value, returns the key to delete from `mapB`.
 *                  Defaults to using the same key for both maps.
 * @param logTag - Logger tag for the pruning warning (e.g. `"cron.pgboss.mapPruned"`).
 */
export function pruneMaps<KA extends string, VA>(
  mapA: Map<KA, VA>,
  mapB: Map<unknown, unknown>,
  mapBKeyOf: (value: VA, key: KA) => string = (_value, key) => key,
  logTag = "cron.queue.mapPruned"
): void {
  if (mapA.size <= MAP_MAX_SIZE) return;
  const toRemove = Math.ceil(mapA.size * 0.2);
  let removed = 0;
  for (const [key, value] of mapA) {
    if (removed >= toRemove) break;
    mapA.delete(key);
    mapB.delete(mapBKeyOf(value, key));
    removed++;
  }
  logger.warn(logTag, { removed, remaining: mapA.size });
}

/** Shared BullMQ import helper — avoids duplicating dynamic-import logic across adapters. */
type BullMQModule = typeof import("bullmq");

async function tryImportBullMQ(): Promise<BullMQModule | null> {
  try {
    // Use variable to avoid static module resolution for optional dependency
    const moduleName = "bullmq";
    return await import(moduleName);
  } catch {
    return null;
  }
}

/**
 * Creates a scaffolded BullMQ adapter that throws not-implemented errors.
 * Both bullmq-pg and bullmq-redis adapters use this until full wiring is done.
 */
export async function createBullMQStub(backendName: string): Promise<CronQueueAdapter> {
  const bullmq = await tryImportBullMQ();
  if (!bullmq) {
    throw new CronQueueBackendNotAvailable(
      `BullMQ-${backendName} adapter requires the 'bullmq' package. Install it with: bun add bullmq`
    );
  }
  throw new CronQueueBackendNotAvailable(
    `BullMQ-${backendName} adapter is scaffolded but not fully wired. Set CRON_QUEUE_BACKEND=PG_BOSS or CRON_QUEUE_BACKEND=CUSTOM_SQL.`
  );
}
