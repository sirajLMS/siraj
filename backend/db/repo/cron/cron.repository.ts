import { and, asc, count, eq, gt, inArray, lte, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import {
  DEFAULT_PRIOR_STATUSES,
  INFLIGHT_STATUSES,
  paginatedRuns,
  queryScheduleList,
  REPLACE_MANUAL_TRIGGER_MSG,
  reconcileStuckRunsInTx,
  toRunReturnType,
  withTx,
} from "@/backend/db/repo/cron/cron.repository.helpers";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { cronHeartbeats, cronRuns, cronSchedules } from "@/backend/db/schema";
import {
  CronConcurrencyPolicy,
  CronRunStatus,
  CronScheduleStatus,
  type CronTriggerSource,
} from "@/backend/enum/cron/cron.enums";
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
  CronScheduleSelectType,
  CronScheduleUpdateInput,
  DBTransaction,
} from "@/backend/types";

export { toScheduleReturnType } from "@/backend/db/repo/cron/cron.repository.helpers";

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
    return queryScheduleList(params, tx);
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
      await acquireAdvisoryLock(t, `cron_schedule_claim_${scheduleId}`);

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
    return withTx(tx, async t => reconcileStuckRunsInTx(t, now, batch));
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
