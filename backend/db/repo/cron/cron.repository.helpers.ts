import { and, count, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, db, isSqlite, queryDb } from "@/backend/db";
import { cronHeartbeats, cronRuns, cronSchedules } from "@/backend/db/schema";
import {
  CronRunStatus,
  isCronConcurrencyPolicy,
  isCronJobKind,
  isCronRunStatus,
  isCronScheduleStatus,
  isCronTriggerSource,
} from "@/backend/enum/cron/cron.enums";
import type {
  CronRunListResult,
  CronRunReturnType,
  CronRunSelectType,
  CronScheduleListInput,
  CronScheduleListResult,
  CronScheduleReturnType,
  CronScheduleSelectType,
  DBTransaction,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";

export const INFLIGHT_STATUSES = [CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING] as const;

/** Maximum time (in seconds) a PENDING run is allowed to remain un-dispatched
 *  before `reconcileStuckRuns` reaps it as TIMEOUT. This covers the race
 *  where `dispatchDueSchedules` claims a run (commits PENDING + advances
 *  nextRunAt) but the process crashes before `adapter.send` is called. */
const PENDING_STUCK_TIMEOUT_SECONDS = 300; // 5 minutes

// Internal DB-level audit messages — NOT user-facing strings.
// The repository has no locale context, so these generic constants are
// stored as-is in the database. The service layer translates user-facing
// errors via i18n at the resolver boundary.
export const REPLACE_MANUAL_TRIGGER_MSG = "Replaced by manual trigger";
const HEARTBEAT_TIMEOUT_MSG = "Heartbeat timeout";

/**
 * Default valid **prior** statuses for each target status, used when `fromStatuses`
 * is not explicitly passed. This prevents invalid forward-overwriting transitions
 * (e.g. a COMPLETED/FAILED/TIMEOUT run being flipped back to RUNNING).
 */
export const DEFAULT_PRIOR_STATUSES: Readonly<Record<CronRunStatus, CronRunStatus[]>> = {
  [CronRunStatus.PENDING]: [CronRunStatus.PENDING],
  [CronRunStatus.RUNNING]: [CronRunStatus.PENDING, CronRunStatus.RETRYING],
  [CronRunStatus.COMPLETED]: [CronRunStatus.RUNNING, CronRunStatus.RETRYING],
  [CronRunStatus.FAILED]: [CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING],
  [CronRunStatus.TIMEOUT]: [CronRunStatus.RUNNING, CronRunStatus.RETRYING],
  [CronRunStatus.CANCELLED]: [...INFLIGHT_STATUSES],
  [CronRunStatus.RETRYING]: [CronRunStatus.PENDING, CronRunStatus.RUNNING],
};

/**
 * Execute a runner function either in the provided transaction or in a new
 * `db.transaction`. Eliminates the `tx ? runner(tx) : db.transaction(runner)`
 * boilerplate repeated across repository methods.
 */
export async function withTx<T>(tx: DBTransaction | undefined, runner: (t: DBTransaction) => Promise<T>): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

// Drizzle's pgEnum infers enum columns as `string`, but the DB enforces valid
// enum values. Narrow at runtime via type guards so we avoid an unsafe
// `as` assertion when constructing the strongly-typed return value.

export function toScheduleReturnType(row: CronScheduleSelectType): CronScheduleReturnType {
  const {
    createdByUserId: _createdByUserId,
    updatedByUserId: _updatedByUserId,
    jobKind,
    status,
    concurrencyPolicy,
    ...rest
  } = row;
  if (!isCronJobKind(jobKind) || !isCronScheduleStatus(status) || !isCronConcurrencyPolicy(concurrencyPolicy)) {
    throw new Error(`Invalid cron schedule row (id=${row.id}): enum field contains unexpected value`);
  }
  return { ...rest, jobKind, status, concurrencyPolicy };
}

export function toRunReturnType(row: CronRunSelectType): CronRunReturnType {
  const { errorStack: _errorStack, jobKind, status, triggerSource, ...rest } = row;
  if (!isCronJobKind(jobKind) || !isCronRunStatus(status) || !isCronTriggerSource(triggerSource)) {
    throw new Error(`Invalid cron run row (id=${row.id}): enum field contains unexpected value`);
  }
  return { ...rest, jobKind, status, triggerSource };
}

/** Build a paginated list result (rows + totalCount) for the runs table. */
export async function paginatedRuns(
  where: SQL | undefined,
  params: { limit: number; offset: number },
  tx?: DBTransaction
): Promise<CronRunListResult> {
  const { limit, offset } = params;
  const [rows, totalRows] = await Promise.all([
    queryDb(tx).select().from(cronRuns).where(where).orderBy(desc(cronRuns.startedAt)).limit(limit).offset(offset),
    queryDb(tx).select({ count: count() }).from(cronRuns).where(where),
  ]);

  return {
    rows: rows.map(toRunReturnType),
    totalCount: totalRows[0]?.count ?? 0,
  };
}

/** Build the filtered, paginated schedule list used by `CronRepository.listSchedules`. */
export async function queryScheduleList(
  params: CronScheduleListInput,
  tx?: DBTransaction
): Promise<CronScheduleListResult> {
  const { status, jobKind, name, limit = 25, offset = 0 } = params;
  const conditions = [];
  if (status) conditions.push(eq(cronSchedules.status, status));
  if (jobKind) conditions.push(eq(cronSchedules.jobKind, jobKind));
  if (name) {
    const escapedName = escapeLikeWildcards(name);
    conditions.push(caseInsensitiveLike(cronSchedules.name, `%${escapedName}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totalRows] = await Promise.all([
    queryDb(tx)
      .select()
      .from(cronSchedules)
      .where(where)
      .orderBy(desc(cronSchedules.createdAt))
      .limit(limit)
      .offset(offset),
    queryDb(tx).select({ count: count() }).from(cronSchedules).where(where),
  ]);

  return {
    rows: rows.map(toScheduleReturnType),
    totalCount: totalRows[0]?.count ?? 0,
  };
}

/**
 * Dialect-aware "stuck run" predicate.
 * PG: ::timestamptz cast + INTERVAL '1 second' arithmetic.
 * SQLite: unixepoch() converts ISO/text timestamps to integer seconds for correct
 * numeric comparison (avoids lexicographic string-compare pitfalls across formats).
 * SQLite stores timestamptz as integer epoch-ms (mode: timestamp_ms).
 * Compare directly in ms; timeouts are in seconds so multiply by 1000.
 */
function buildStuckRunCondition(now: Date): SQL {
  const nowMs = now.getTime();
  return isSqlite()
    ? sql`CASE WHEN ${cronRuns.status} = ${CronRunStatus.PENDING} THEN ${cronRuns.createdAt} < ${nowMs} - ${PENDING_STUCK_TIMEOUT_SECONDS * 1000} ELSE ${cronRuns.startedAt} < ${nowMs} - COALESCE(${cronSchedules.timeoutSeconds}, 1) * 1000 AND COALESCE(hb.last_beat_at, ${cronRuns.startedAt}) < ${nowMs} - COALESCE(${cronSchedules.timeoutSeconds}, 1) * 1000 END`
    : sql`CASE WHEN ${cronRuns.status} = ${CronRunStatus.PENDING}::text::cron_run_status THEN ${cronRuns.createdAt} < (${now}::timestamptz) - ${PENDING_STUCK_TIMEOUT_SECONDS} * INTERVAL '1 second' ELSE ${cronRuns.startedAt} < (${now}::timestamptz) - (COALESCE(${cronSchedules.timeoutSeconds}, 1)) * INTERVAL '1 second' AND COALESCE(hb.last_beat_at, ${cronRuns.startedAt}) < (${now}::timestamptz) - (COALESCE(${cronSchedules.timeoutSeconds}, 1)) * INTERVAL '1 second' END`;
}

const STUCK_RUN_STATUSES = [CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING] as const;

/** Reap stuck runs (PENDING past dispatch timeout, or RUNNING/RETRYING past
 *  their heartbeat/timeout window) and mark them TIMEOUT. Returns the number
 *  of runs transitioned. */
export async function reconcileStuckRunsInTx(t: DBTransaction, now: Date, batch: number): Promise<number> {
  // Single LEFT JOIN against an aggregated heartbeat subquery — replaces correlated subqueries
  const stuckRuns = await t
    .select({
      runId: cronRuns.id,
      timeoutSeconds: cronSchedules.timeoutSeconds,
    })
    .from(cronRuns)
    .innerJoin(cronSchedules, eq(cronRuns.scheduleId, cronSchedules.id))
    .leftJoin(
      sql`(SELECT ${cronHeartbeats.runId} AS run_id, MAX(${cronHeartbeats.lastBeatAt}) AS last_beat_at FROM ${cronHeartbeats} GROUP BY ${cronHeartbeats.runId}) hb`,
      sql`hb.run_id = ${cronRuns.id}`
    )
    .where(and(inArray(cronRuns.status, [...STUCK_RUN_STATUSES]), buildStuckRunCondition(now)))
    .limit(batch);

  if (stuckRuns.length === 0) return 0;

  const runIds = stuckRuns.map(r => r.runId);
  const result = await t
    .update(cronRuns)
    .set({ status: CronRunStatus.TIMEOUT, errorMessage: HEARTBEAT_TIMEOUT_MSG, updatedAt: now })
    .where(and(inArray(cronRuns.id, runIds), inArray(cronRuns.status, [...STUCK_RUN_STATUSES])))
    .returning({ id: cronRuns.id });

  return result.length;
}
