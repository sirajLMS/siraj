/**
 * pg-boss adapter state + connection/queue lifecycle.
 *
 * Owns the closure-scoped `PgBossState` created once per
 * `createPgBossAdapter()` call, plus starting the client, creating queue
 * topics, and fetching/claiming jobs. Mutation operations live in
 * `pgboss.adapter.operations.ts`.
 */
import { type ConstructorOptions, type Job, PgBoss } from "pg-boss";
import { poolMax } from "@/backend/db/connection-strategy";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { DomainError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { CronQueueBackendNotAvailable, safeCronJobKind } from "@/backend/services/cron/cron.helpers";
import { computeHeartbeatSeconds } from "@/backend/services/cron/cron-heartbeat.utils";
import { formatError } from "@/backend/services/cron/cron-utils";
import { pruneMaps } from "@/backend/services/cron/queue-adapters/bullmq-shared";
import type { CronJobPayload } from "@/backend/types";

const QUEUE_NAME_PREFIX = "cron_";

function getQueueName(jobKind: string): string {
  return `${QUEUE_NAME_PREFIX}${jobKind}`;
}

/**
 * Determine whether LISTEN/NOTIFY should be disabled for pg-boss.
 *
 * Resolution order:
 *  1. Explicit env flag `CRON_QUEUE_DISABLE_LISTEN_NOTIFY` — if set to a truthy
 *     value (`"1"`, `"true"`), LISTEN/NOTIFY is disabled immediately.
 *  2. Implicit detection via `DATABASE_URL` substring sniffing — if the URL contains
 *     `-pooler` (Neon pooler hostname) and `neon`, or `pgbouncer=true`, we assume
 *     PgBouncer transaction-mode pooling which breaks LISTEN/NOTIFY.
 *
 * The implicit sniffing may produce false positives if an unrelated URL substring
 * matches, which is why the explicit env flag is checked first. Deployments that
 * want to force-enable LISTEN/NOTIFY despite pooling (e.g. direct-mode over a proxy
 * with `-pooler` in the hostname) can set `CRON_QUEUE_DISABLE_LISTEN_NOTIFY=false`.
 */
function shouldDisableListenNotify(): boolean {
  // 1. Explicit env flag takes precedence
  const explicitFlag = process.env.CRON_QUEUE_DISABLE_LISTEN_NOTIFY;
  if (explicitFlag !== undefined) {
    const isDisabled = explicitFlag === "1" || explicitFlag.toLowerCase() === "true";
    if (isDisabled) {
      logger.warn("cron.pgboss.listenNotify.disabled", {
        reason: "CRON_QUEUE_DISABLE_LISTEN_NOTIFY env flag is set",
      });
      return true;
    }
    // Explicitly enabled — skip implicit sniffing
    return false;
  }

  // 2. Implicit detection via DATABASE_URL substring sniffing
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isPooler = dbUrl.includes("-pooler") || dbUrl.includes("pgbouncer=true");
  const isNeon = dbUrl.includes("neon");
  if (isPooler && isNeon) {
    logger.warn("cron.pgboss.listenNotify.disabled", {
      reason: "Neon -pooler hostname or PgBouncer detected; LISTEN/NOTIFY breaks under transaction-mode pooling",
    });
    return true;
  }
  return false;
}

/**
 * Closure-scoped mutable state shared across all adapter methods.
 * Created inside `createPgBossAdapter` so each call produces an independent instance.
 */
export interface PgBossState {
  boss: PgBoss | null;
  started: boolean;
  knownQueues: Set<string>;
  jobIdToPayload: Map<string, CronJobPayload>;
  jobIdToQueue: Map<string, string>;
}

export function createPgBossState(): PgBossState {
  return {
    boss: null,
    started: false,
    knownQueues: new Set(),
    jobIdToPayload: new Map(),
    jobIdToQueue: new Map(),
  };
}

export async function ensureStarted(state: PgBossState): Promise<PgBoss> {
  if (state.boss && state.started) return state.boss;

  const bossOptions: ConstructorOptions = {
    connectionString: getEnvironmentConfig().databaseUrl,
    max: poolMax(),
  };
  if (shouldDisableListenNotify()) {
    bossOptions.useListenNotify = false;
  }

  state.boss = new PgBoss(bossOptions);
  state.boss.on("error", (err: Error) => {
    logger.error("cron.queue.pgboss.error", { message: err.message, stack: err.stack });
  });

  try {
    await state.boss.start();
    state.started = true;
    logger.info("cron.pgboss.started", { useListenNotify: !bossOptions.useListenNotify });
  } catch (err) {
    logger.error("cron.pgboss.start.failed", {
      message: formatError(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    state.boss = null;
    state.started = false;
    throw new CronQueueBackendNotAvailable(`Failed to start pg-boss: ${formatError(err)}`);
  }
  return state.boss;
}

async function ensureQueue(
  state: PgBossState,
  b: PgBoss,
  jobKind: string,
  opts?: { maxRetries?: number; retryBackoffSeconds?: number; timeoutSeconds?: number }
): Promise<string> {
  const name = getQueueName(jobKind);
  if (state.knownQueues.has(name)) return name;

  const maxRetries = opts?.maxRetries ?? 3;
  const retryBackoffSeconds = opts?.retryBackoffSeconds ?? 60;
  const timeoutSeconds = opts?.timeoutSeconds ?? 300;

  await b.createQueue(name, {
    retryLimit: maxRetries,
    retryDelay: retryBackoffSeconds,
    retryBackoff: true,
    expireInSeconds: timeoutSeconds,
    heartbeatSeconds: computeHeartbeatSeconds(timeoutSeconds),
    deadLetter: `${name}__dlq`,
  });
  state.knownQueues.add(name);
  return name;
}

export function pruneState(state: PgBossState): void {
  pruneMaps(state.jobIdToPayload, state.jobIdToQueue, (_payload, jid) => jid, "cron.pgboss.mapPruned");
}

/**
 * Adapter-internal shape of the `data` payload on a raw pg-boss fetched
 * job. Used as the generic type argument to `b.fetch<T>()` so the return
 * value is already typed.
 */
type FetchedJobData = {
  runId: string;
  scheduleId: string;
  jobKind: string;
  payload: Record<string, unknown> | null;
  attempt: number;
  timeoutSeconds: number;
  maxRetries?: number;
  retryBackoffSeconds?: number;
};

/** Adapter-internal: per-queue result of the fan-out `fetch` call. */
type FetchedBatch = { name: string; jobs: Job<FetchedJobData>[] | null };

async function fetchFromQueues(state: PgBossState, b: PgBoss, count: number): Promise<CronJobPayload[]> {
  const queues = state.knownQueues.size > 0 ? [...state.knownQueues] : [];
  if (queues.length === 0) return [];

  const batchPerQueue = Math.max(1, Math.ceil(count / queues.length));

  const batchResults: FetchedBatch[] = await Promise.all(
    queues.map(async name => {
      try {
        const raw = await b.fetch<FetchedJobData>(name, { batchSize: batchPerQueue });
        return { name, jobs: raw };
      } catch (err) {
        logger.warn("cron.pgboss.fetch.failed", { queue: name, error: formatError(err) });
        return { name, jobs: null };
      }
    })
  );

  const results: CronJobPayload[] = [];
  for (const { name, jobs } of batchResults) {
    if (jobs) {
      const jobArray = Array.isArray(jobs) ? jobs : [jobs];
      for (const j of jobArray) {
        const data: CronJobPayload = {
          runId: j.data.runId,
          scheduleId: j.data.scheduleId,
          jobKind: safeCronJobKind(j.data.jobKind),
          payload: j.data.payload,
          attempt: j.data.attempt,
          timeoutSeconds: j.data.timeoutSeconds,
          queueJobId: j.id,
          maxRetries: j.data.maxRetries,
          retryBackoffSeconds: j.data.retryBackoffSeconds,
        };
        state.jobIdToQueue.set(j.id, name);
        state.jobIdToPayload.set(j.id, data);
        results.push(data);
      }
    }
  }
  return results.slice(0, count);
}

export async function initPgBossAdapter(state: PgBossState): Promise<void> {
  await ensureStarted(state);
}

export async function sendPgBossJob(state: PgBossState, job: CronJobPayload): Promise<string> {
  const b = await ensureStarted(state);
  const name = await ensureQueue(state, b, job.jobKind, {
    maxRetries: job.maxRetries,
    retryBackoffSeconds: job.retryBackoffSeconds,
    timeoutSeconds: job.timeoutSeconds,
  });
  const { queueJobId: _omit, ...sendData } = { ...job };
  const jobId = await b.send(name, sendData);
  if (!jobId) throw new DomainError("CRON_QUEUE_SEND_FAILED", `pg-boss send returned null for queue ${name}`);
  state.jobIdToPayload.set(jobId, job);
  state.jobIdToQueue.set(jobId, name);
  pruneState(state);
  logger.debug("cron.pgboss.send", { jobId, queue: name, runId: job.runId });
  return jobId;
}

export async function fetchPgBossJobs(state: PgBossState, count: number): Promise<CronJobPayload[]> {
  const b = await ensureStarted(state);
  return fetchFromQueues(state, b, count);
}
