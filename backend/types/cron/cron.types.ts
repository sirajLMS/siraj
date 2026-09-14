import type { cronHeartbeats, cronRuns, cronSchedules } from "@/backend/db/schema";
import type {
  CronConcurrencyPolicy,
  CronJobKind,
  CronRunStatus,
  CronScheduleStatus,
  CronTriggerSource,
} from "@/backend/enum/cron/cron.enums";

// ── cron_schedules ──

export type CronScheduleSelectType = typeof cronSchedules.$inferSelect;
export type CronScheduleInsertType = typeof cronSchedules.$inferInsert;

export type CronScheduleReturnType = Omit<CronScheduleSelectType, "createdByUserId" | "updatedByUserId"> & {
  jobKind: CronJobKind;
  status: CronScheduleStatus;
  concurrencyPolicy: CronConcurrencyPolicy;
};

export type CronScheduleSubmitInput = Omit<
  CronScheduleInsertType,
  "id" | "createdAt" | "updatedAt" | "nextRunAt" | "lastRunAt" | "updatedByUserId" | "createdByUserId"
>;

export type CronScheduleListInput = {
  status?: CronScheduleStatus;
  jobKind?: CronJobKind;
  name?: string | null;
  limit?: number;
  offset?: number;
};

export type CronScheduleListResult = {
  rows: CronScheduleReturnType[];
  totalCount: number;
};

export type CronScheduleUpdateInput = Partial<
  Omit<CronScheduleInsertType, "id" | "createdAt" | "createdByUserId" | "updatedByUserId">
>;

/** @internal — repo-layer-only type. Extends `CronScheduleUpdateInput` with the
 *  `updatedByUserId` audit field that the repository sets internally. This is
 *  not a canonical API-facing type and must not be referenced outside the
 *  repository layer. */
export type CronScheduleRepoUpdateInput = CronScheduleUpdateInput & {
  updatedByUserId?: string;
};

// ── cron_runs ──

export type CronRunSelectType = typeof cronRuns.$inferSelect;
export type CronRunInsertType = typeof cronRuns.$inferInsert;

export type CronRunReturnType = Omit<CronRunSelectType, "errorStack" | "jobKind" | "status" | "triggerSource"> & {
  jobKind: CronJobKind;
  status: CronRunStatus;
  triggerSource: CronTriggerSource;
};

export type CronRunListInput = {
  scheduleId?: string;
  status?: CronRunStatus;
  statuses?: CronRunStatus[];
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
};

export type CronRunListResult = {
  rows: CronRunReturnType[];
  totalCount: number;
};

/** Optional metadata fields that can be attached when updating a cron run's
 *  status. Used by `updateRunStatus` in the repository and by the service
 *  layer when transitioning run lifecycle states.
 *
 *  All fields are optional because different status transitions set different
 *  subsets (e.g. COMPLETED sets `completedAt`, RETRYING resets `durationMs`). */
export type CronRunExtrasType = {
  completedAt?: Date;
  durationMs?: number | null;
  errorMessage?: string | null;
  errorStack?: string | null;
  workerId?: string | null;
  attempt?: number;
  startedAt?: Date;
};

// ── cron_heartbeats ──

export type CronHeartbeatSelectType = typeof cronHeartbeats.$inferSelect;
export type CronHeartbeatInsertType = typeof cronHeartbeats.$inferInsert;

// ── Queue adapter types ──

/**
 * Raw row shape returned by the custom-sql `cron_queue` table.
 * Represents the DB entity for the custom-sql queue adapter.
 *
 * Intentionally hand-defined rather than derived from Drizzle `$inferSelect`
 * because `cron_queue` is managed via raw SQL (not Drizzle ORM). There is no
 * Drizzle schema entry for this table, so `$inferSelect` is unavailable.
 */
export type CronQueueRow = {
  id: string;
  run_id: string;
  schedule_id: string;
  job_kind: string;
  payload: Record<string, unknown> | null;
  attempt: number;
  timeout_seconds: number;
  max_retries: number;
  retry_backoff_seconds: number;
};

export type CronQueueStats = {
  backend: string;
  pending: number;
  inFlight: number;
  failed: number;
  byJobKind: Record<string, { pending: number; inFlight: number; failed: number }>;
};

export type CronJobPayload = {
  runId: string;
  scheduleId: string;
  jobKind: CronJobKind;
  payload: Record<string, unknown> | null;
  attempt: number;
  timeoutSeconds: number;
  queueJobId?: string;
  maxRetries?: number;
  retryBackoffSeconds?: number;
};

// ── Dispatch types ──

export type DispatchDueResult = {
  dispatched: number;
  skipped: number;
  failed: number;
};

export type DispatchByIdResult = {
  runId: string | null;
  queueJobId: string | null;
  skipped?: boolean;
};

export type WorkerDrainResult = {
  processed: number;
  failed: number;
  retried: number;
};

// ── Queue adapter contract ──

export type CronJobResult = {
  success: boolean;
  error?: string;
  stack?: string;
};

// ── Handler execution context ──

type CronJobHandlerContext = {
  /** AbortSignal that fires when the job's `timeoutSeconds` elapses. */
  signal: AbortSignal;
};

/** Handler function type: receives the job payload and optional execution context, returns a result. */
export type CronJobHandler = (job: CronJobPayload, context?: CronJobHandlerContext) => Promise<CronJobResult>;

export type CronQueueAdapter = {
  init(): Promise<void>;
  send(job: CronJobPayload): Promise<string>;
  fetch(opts: { count: number }): Promise<CronJobPayload[]>;
  complete(jobId: string): Promise<void>;
  fail(jobId: string, error: string, stack?: string): Promise<void>;
  retry(jobId: string, delaySeconds: number, newAttempt?: number): Promise<void>;
  getQueueStats(): Promise<CronQueueStats>;
  shutdown(): Promise<void>;
};

// ── Build-time config types ──

export type CronExecutionMode = "vercel" | "vercel-daily" | "external" | "standalone";

export interface CronDefinition {
  path: string;
  scheduleEnv: string;
  /** Default schedule when CRON_EXECUTION_MODE=vercel (Pro; may be sub-daily). */
  defaultSchedule: string;
  /**
   * Hobby-safe daily schedule used when mode is not `vercel` and the resolved
   * schedule would run more than once per day (Vercel Hobby rejects those).
   */
  hobbySafeSchedule?: string;
  alwaysInclude: boolean;
}

// ── Cron queue adapter types (relocated from service layer, R2) ──

/** Adapter-internal interface for a pg-compatible connection pool. */
export interface QueryablePool {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
  end(): Promise<void>;
}

/** @internal — adapter-state type for the custom-SQL queue adapter. Holds the
 *  lazily-created pool plus the run-id ↔ queue-id tracking maps used to
 *  correlate queue jobs with their originating cron runs. Not a canonical
 *  API-facing type and must not be referenced outside the cron queue adapter. */
export type CustomSqlState = {
  pool: QueryablePool | null;
  runIdToQueueId: Map<string, string>;
  queueIdToRunId: Map<string, string>;
};
