import { and, asc, count, desc, eq, gt, ilike, inArray, lte, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { cronHeartbeats, cronRuns, cronSchedules } from "@/backend/db/schema";
import {
  CronConcurrencyPolicy,
  CronRunStatus,
  CronScheduleStatus,
  type CronTriggerSource,
  isCronConcurrencyPolicy,
  isCronJobKind,
  isCronRunStatus,
  isCronScheduleStatus,
  isCronTriggerSource,
} from "@/backend/enum/cron/cron.enums";
import type { DBTransaction } from "@/backend/types";
import type {
  CronHeartbeatInsertType,
  CronHeartbeatSelectType,
  CronRunExtrasType,
  CronRunInsertType,
  CronRunListInput,
  CronRunListResult,
  CronRunReturnType,
  CronRunSelectType,
  CronScheduleInsertType,
  CronScheduleListInput,
  CronScheduleListResult,
  CronScheduleRepoUpdateInput,
  CronScheduleReturnType,
  CronScheduleSelectType,
  CronScheduleUpdateInput,
} from "@/backend/types/cron/cron.types";

const INFLIGHT_STATUSES = [CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING] as const;

/**
 * Execute a runner function either in the provided transaction or in a new
 * `db.transaction`. Eliminates the `tx ? runner(tx) : db.transaction(runner)`
 * boilerplate repeated across repository methods.
 */
async function withTx<T>(tx: DBTransaction | undefined, runner: (t: DBTransaction) => Promise<T>): Promise<T> {
  return tx ? runner(tx) : db.transaction(runner);
}

/** Build a paginated list result (rows + totalCount) for the runs table. */
async function paginatedRuns(
  where: ReturnType<typeof eq> | undefined,
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

/** Maximum time (in seconds) a PENDING run is allowed to remain un-dispatched
 *  before `reconcileStuckRuns` reaps it as TIMEOUT. This covers the race
 *  where `dispatchDueSchedules` claims a run (commits PENDING + advances
 *  nextRunAt) but the process crashes before `adapter.send` is called. */
const PENDING_STUCK_TIMEOUT_SECONDS = 300; // 5 minutes

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

function toRunReturnType(row: CronRunSelectType): CronRunReturnType {
  const { errorStack: _errorStack, jobKind, status, triggerSource, ...rest } = row;
  if (!isCronJobKind(jobKind) || !isCronRunStatus(status) || !isCronTriggerSource(triggerSource)) {
    throw new Error(`Invalid cron run row (id=${row.id}): enum field contains unexpected value`);
  }
  return { ...rest, jobKind, status, triggerSource };
}

// Internal DB-level audit messages — NOT user-facing strings.
// The repository has no locale context, so these generic constants are
// stored as-is in the database. The service layer translates user-facing
// errors via i18n at the resolver boundary.
const REPLACE_MANUAL_TRIGGER_MSG = "Replaced by manual trigger";
const HEARTBEAT_TIMEOUT_MSG = "Heartbeat timeout";

/**
 * Default valid **prior** statuses for each target status, used when `fromStatuses`
 * is not explicitly passed. This prevents invalid forward-overwriting transitions
 * (e.g. a COMPLETED/FAILED/TIMEOUT run being flipped back to RUNNING).
 */
const DEFAULT_PRIOR_STATUSES: Readonly<Record<CronRunStatus, CronRunStatus[]>> = {
  [CronRunStatus.PENDING]: [CronRunStatus.PENDING],
  [CronRunStatus.RUNNING]: [CronRunStatus.PENDING, CronRunStatus.RETRYING],
  [CronRunStatus.COMPLETED]: [CronRunStatus.RUNNING, CronRunStatus.RETRYING],
  [CronRunStatus.FAILED]: [CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING],
  [CronRunStatus.TIMEOUT]: [CronRunStatus.RUNNING, CronRunStatus.RETRYING],
  [CronRunStatus.CANCELLED]: [...INFLIGHT_STATUSES],
  [CronRunStatus.RETRYING]: [CronRunStatus.PENDING, CronRunStatus.RUNNING],
};

export namespace CronRepository {
  // ── Schedule CRUD ──

  export const createSchedule = async (
    input: CronScheduleInsertType,
    tx?: DBTransaction
  ): Promise<CronScheduleSelectType> => {
    return withTx(tx, async t => {
      const [row] = await t.insert(cronSchedules).values(input).returning();
      return row;
    });
  };

  export const updateSchedule = async (
    id: string,
    input: CronScheduleRepoUpdateInput,
    tx?: DBTransaction
  ): Promise<CronScheduleSelectType | null> => {
    return withTx(tx, async t => {
      const [row] = await t
        .update(cronSchedules)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(cronSchedules.id, id))
        .returning();
      return row ?? null;
    });
  };

  /**
   * Atomically update a schedule only if it currently has the expected status.
   * Returns `false` when the status guard fails (no rows updated).
   */
  export const updateScheduleIfStatus = async (
    id: string,
    values: Partial<CronScheduleUpdateInput>,
    requiredStatus: CronScheduleStatus,
    tx?: DBTransaction
  ): Promise<CronScheduleSelectType | null> => {
    const [updated] = await queryDb(tx)
      .update(cronSchedules)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(cronSchedules.id, id), eq(cronSchedules.status, requiredStatus)))
      .returning();
    return updated ?? null;
  };

  export const getScheduleById = async (id: string, tx?: DBTransaction): Promise<CronScheduleSelectType | null> => {
    const rows = await queryDb(tx).select().from(cronSchedules).where(eq(cronSchedules.id, id)).limit(1);
    return rows[0] ?? null;
  };

  export const getScheduleByName = async (name: string, tx?: DBTransaction): Promise<CronScheduleSelectType | null> => {
    const rows = await queryDb(tx).select().from(cronSchedules).where(eq(cronSchedules.name, name)).limit(1);
    return rows[0] ?? null;
  };

  export const listSchedules = async (
    params: CronScheduleListInput = {},
    tx?: DBTransaction
  ): Promise<CronScheduleListResult> => {
    const { status, jobKind, name, limit = 25, offset = 0 } = params;
    const conditions = [];
    if (status) conditions.push(eq(cronSchedules.status, status));
    if (jobKind) conditions.push(eq(cronSchedules.jobKind, jobKind));
    if (name) {
      const escapedName = name.replaceAll("%", String.raw`\%`).replaceAll("_", String.raw`\_`);
      conditions.push(ilike(cronSchedules.name, `%${escapedName}%`));
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
  };

  // ── Due-schedule dispatch ──

  export const listDueSchedules = async (
    now: Date,
    limit: number,
    tx?: DBTransaction
  ): Promise<CronScheduleSelectType[]> => {
    const baseConditions = [eq(cronSchedules.status, CronScheduleStatus.ACTIVE), lte(cronSchedules.nextRunAt, now)];

    // For SKIP concurrency policy, exclude schedules with in-flight runs
    const skipCondn = and(
      eq(cronSchedules.concurrencyPolicy, CronConcurrencyPolicy.SKIP),
      inArray(
        cronSchedules.id,
        queryDb(tx)
          .select({ id: cronRuns.scheduleId })
          .from(cronRuns)
          .where(inArray(cronRuns.status, [...INFLIGHT_STATUSES]))
      )
    );

    const rows = await queryDb(tx)
      .select()
      .from(cronSchedules)
      .where(and(and(...baseConditions), sql`NOT (${skipCondn ?? sql.raw("false")})`))
      .orderBy(cronSchedules.nextRunAt)
      .limit(limit);

    return rows;
  };

  // ── Atomic claim next run ──

  export const claimNextRun = async (
    scheduleId: string,
    now: Date,
    triggerSource: CronTriggerSource,
    nextRunAt: Date,
    tx?: DBTransaction,
    forceDue: boolean = false,
    overridePayload?: Record<string, unknown> | null
  ): Promise<{ runId: string } | null> => {
    return withTx(tx, async (t): Promise<{ runId: string } | null> => {
      await t.execute(sql`SELECT pg_advisory_xact_lock(hashtext('cron_schedule_claim_' || ${scheduleId}::text))`);

      // Check schedule is still active and still due.
      // When `forceDue` is true (manual triggers), the `nextRunAt <= now` due-check
      // is bypassed so the claim succeeds even if the schedule is not yet due.
      // This eliminates the TOCTOU race that would occur if the service pre-updated
      // `nextRunAt` in a separate query before calling claimNextRun.
      const dueCondition = forceDue ? sql.raw("true") : lte(cronSchedules.nextRunAt, now);
      const [schedule] = await t
        .select()
        .from(cronSchedules)
        .where(and(eq(cronSchedules.id, scheduleId), eq(cronSchedules.status, CronScheduleStatus.ACTIVE), dueCondition))
        .limit(1);

      if (!schedule) return null;

      // For SKIP policy, check no in-flight run exists
      // `schedule.concurrencyPolicy` is inferred as `string` by drizzle's pgEnum;
      // widen the enum literal to `string` so the comparison is type-safe and
      // satisfies `no-unsafe-enum-comparison`.
      if (schedule.concurrencyPolicy === (CronConcurrencyPolicy.SKIP as string)) {
        const inFlight = await t
          .select({ id: cronRuns.id })
          .from(cronRuns)
          .where(and(eq(cronRuns.scheduleId, scheduleId), inArray(cronRuns.status, [...INFLIGHT_STATUSES])))
          .limit(1);
        if (inFlight.length > 0) return null;
      }

      // For REPLACE policy, cancel in-flight runs
      if (schedule.concurrencyPolicy === (CronConcurrencyPolicy.REPLACE as string)) {
        await t
          .update(cronRuns)
          .set({
            status: CronRunStatus.CANCELLED,
            errorMessage: REPLACE_MANUAL_TRIGGER_MSG,
            updatedAt: now,
          })
          .where(and(eq(cronRuns.scheduleId, scheduleId), inArray(cronRuns.status, [...INFLIGHT_STATUSES])));
      }

      // Update schedule's nextRunAt
      await t
        .update(cronSchedules)
        .set({ nextRunAt, lastRunAt: now, updatedAt: now })
        .where(eq(cronSchedules.id, scheduleId));

      // Insert new run
      const runInsert: CronRunInsertType = {
        scheduleId,
        jobKind: schedule.jobKind,
        status: CronRunStatus.PENDING,
        triggerSource,
        payload: overridePayload ?? schedule.payload,
        attempt: 1,
        startedAt: now,
      };
      const [run] = await t.insert(cronRuns).values(runInsert).returning();

      return run ? { runId: run.id } : null;
    });
  };

  // ── Run lifecycle ──

  /** @internal — kept for testing and future use. Not called by production
   *  dispatch code, which creates runs via `claimNextRun` instead. */
  export const createRun = async (input: CronRunInsertType, tx?: DBTransaction): Promise<CronRunSelectType> => {
    return withTx(tx, async t => {
      const [row] = await t.insert(cronRuns).values(input).returning();
      return row;
    });
  };

  export const updateRunStatus = async (
    runId: string,
    status: CronRunStatus,
    extras?: CronRunExtrasType,
    fromStatuses?: CronRunStatus[],
    tx?: DBTransaction
  ): Promise<CronRunSelectType | null> => {
    return withTx(tx, async t => {
      const allowedPriorStatuses = fromStatuses ?? DEFAULT_PRIOR_STATUSES[status];
      const whereCondition = and(eq(cronRuns.id, runId), inArray(cronRuns.status, allowedPriorStatuses));
      const [row] = await t
        .update(cronRuns)
        .set({ status, ...extras, updatedAt: new Date() })
        .where(whereCondition)
        .returning();
      return row ?? null;
    });
  };

  // ── Append run error ──

  /** @internal — kept for testing and future use. Not called by production
   *  code; only referenced by repository tests. */
  export const appendRunError = async (
    runId: string,
    errorMessage: string,
    tx?: DBTransaction
  ): Promise<CronRunSelectType | null> => {
    const [updated] = await queryDb(tx)
      .update(cronRuns)
      .set({
        errorMessage: sql`COALESCE(${cronRuns.errorMessage}, '') || '\n' || ${errorMessage}`,
        updatedAt: new Date(),
      })
      .where(eq(cronRuns.id, runId))
      .returning();
    return updated ?? null;
  };

  // ── Heartbeats ──

  export const recordHeartbeat = async (input: CronHeartbeatInsertType, tx?: DBTransaction): Promise<void> => {
    return withTx(tx, async t => {
      await t.insert(cronHeartbeats).values(input);
    });
  };

  /** @internal — kept for testing and future use. Only exercised by repository
   *  tests; not used by production dispatch or service code. */
  export const getRunHeartbeats = async (runId: string, tx?: DBTransaction): Promise<CronHeartbeatSelectType[]> => {
    const rows = await queryDb(tx)
      .select()
      .from(cronHeartbeats)
      .where(eq(cronHeartbeats.runId, runId))
      .orderBy(asc(cronHeartbeats.lastBeatAt));
    return rows;
  };

  // ── Active run count ──

  /** @internal — kept for testing and future use. Only referenced by
   *  repository tests; production code uses `claimNextRun` for concurrency
   *  checks instead. */
  export const getActiveRunCount = async (scheduleId: string, tx?: DBTransaction): Promise<number> => {
    const activeStatuses = [CronRunStatus.RUNNING, CronRunStatus.RETRYING] as const;
    const [row] = await queryDb(tx)
      .select({ count: count() })
      .from(cronRuns)
      .where(and(eq(cronRuns.scheduleId, scheduleId), inArray(cronRuns.status, [...activeStatuses])));
    return row?.count ?? 0;
  };

  // ── Reconcile stuck runs ──

  export const reconcileStuckRuns = async (now: Date, batch: number, tx?: DBTransaction): Promise<number> => {
    return withTx(tx, async t => {
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
        .where(
          and(
            inArray(cronRuns.status, [CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING]),
            sql`CASE WHEN ${cronRuns.status} = ${CronRunStatus.PENDING}::text::cron_run_status THEN ${cronRuns.createdAt} < (${now}::timestamptz) - ${PENDING_STUCK_TIMEOUT_SECONDS} * INTERVAL '1 second' ELSE ${cronRuns.startedAt} < (${now}::timestamptz) - (COALESCE(${cronSchedules.timeoutSeconds}, 1)) * INTERVAL '1 second' AND COALESCE(hb.last_beat_at, ${cronRuns.startedAt}) < (${now}::timestamptz) - (COALESCE(${cronSchedules.timeoutSeconds}, 1)) * INTERVAL '1 second' END`
          )
        )
        .limit(batch);

      if (stuckRuns.length === 0) return 0;

      const runIds = stuckRuns.map(r => r.runId);
      const result = await t
        .update(cronRuns)
        .set({ status: CronRunStatus.TIMEOUT, errorMessage: HEARTBEAT_TIMEOUT_MSG, updatedAt: now })
        .where(
          and(
            inArray(cronRuns.id, runIds),
            inArray(cronRuns.status, [CronRunStatus.PENDING, CronRunStatus.RUNNING, CronRunStatus.RETRYING])
          )
        )
        .returning({ id: cronRuns.id });

      return result.length;
    });
  };

  // ── Run queries ──

  export const listRunsBySchedule = async (
    scheduleId: string,
    params: Pick<CronRunListInput, "limit" | "offset"> = {},
    tx?: DBTransaction
  ): Promise<CronRunListResult> => {
    const { limit = 25, offset = 0 } = params;
    const where = eq(cronRuns.scheduleId, scheduleId);
    return paginatedRuns(where, { limit, offset }, tx);
  };

  export const getRunById = async (id: string, tx?: DBTransaction): Promise<CronRunReturnType | null> => {
    const [row] = await queryDb(tx).select().from(cronRuns).where(eq(cronRuns.id, id)).limit(1);
    return row ? toRunReturnType(row) : null;
  };

  export const listRuns = async (params: CronRunListInput, tx?: DBTransaction): Promise<CronRunListResult> => {
    const { scheduleId, status, statuses, from, to, limit = 25, offset = 0 } = params;
    const conditions = [];
    if (scheduleId) conditions.push(eq(cronRuns.scheduleId, scheduleId));
    if (status) conditions.push(eq(cronRuns.status, status));
    if (statuses && statuses.length > 0) conditions.push(inArray(cronRuns.status, statuses));
    if (from) conditions.push(gt(cronRuns.startedAt, from));
    if (to) conditions.push(lte(cronRuns.startedAt, to));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return paginatedRuns(where, { limit, offset }, tx);
  };

  // ── Delete ──

  /** Soft-delete a schedule by setting its status to DISABLED. */
  export const softDeleteScheduleById = async (id: string, tx?: DBTransaction): Promise<void> => {
    return withTx(tx, async t => {
      await t
        .update(cronSchedules)
        .set({ status: CronScheduleStatus.DISABLED, updatedAt: new Date() })
        .where(eq(cronSchedules.id, id));
    });
  };

  /** Permanently delete a schedule and its associated runs (hard delete). */
  export const permanentlyDeleteScheduleById = async (id: string, tx?: DBTransaction): Promise<void> => {
    return withTx(tx, async t => {
      // Delete runs first (FK constraint), then delete schedule
      await t.delete(cronRuns).where(eq(cronRuns.scheduleId, id));
      await t.delete(cronSchedules).where(eq(cronSchedules.id, id));
    });
  };
}
