import { sql } from "drizzle-orm";
import {
  createTable,
  index,
  integerColumn,
  jsonbColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import {
  cronConcurrencyPolicyEnum,
  cronJobKindEnum,
  cronRunStatusEnum,
  cronScheduleStatusEnum,
  cronTriggerSourceEnum,
} from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";

export const cronSchedules = createTable(
  "cron_schedules",
  {
    id: uuidColumn("id"),
    name: varcharColumn("name", { length: 255 }).notNull(),
    description: textColumn("description"),
    cronExpression: varcharColumn("cron_expression", { length: 255 }).notNull(),
    jobKind: cronJobKindEnum("job_kind").notNull(),
    payload: jsonbColumn<Record<string, unknown> | null>("payload"),
    status: cronScheduleStatusEnum("status").notNull().default("ACTIVE"),
    timezone: varcharColumn("timezone", { length: 100 }).notNull().default("UTC"),
    nextRunAt: timestampColumn("next_run_at"),
    lastRunAt: timestampColumn("last_run_at"),
    concurrencyPolicy: cronConcurrencyPolicyEnum("concurrency_policy").notNull().default("ALLOW"),
    maxRetries: integerColumn("max_retries").notNull().default(3),
    retryBackoffSeconds: integerColumn("retry_backoff_seconds").notNull().default(60),
    timeoutSeconds: integerColumn("timeout_seconds").notNull().default(300),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
    createdByUserId: uuidDefaultColumn("created_by_user_id")
      .notNull()
      .references(() => users.id as never, { onDelete: "restrict" }),
    updatedByUserId: uuidDefaultColumn("updated_by_user_id").references(() => users.id as never, {
      onDelete: "set null",
    }),
  },
  table => [
    index("cron_schedules_status_next_run_at_idx").on(table.status, table.nextRunAt),
    uniqueIndex("cron_schedules_name_unique_idx")
      .on(table.name)
      .where(sql`${table.status} IN ('ACTIVE', 'PAUSED')`),
    index("cron_schedules_job_kind_idx").on(table.jobKind),
  ]
);

export const cronRuns = createTable(
  "cron_runs",
  {
    id: uuidColumn("id"),
    scheduleId: uuidDefaultColumn("schedule_id")
      .notNull()
      .references(() => cronSchedules.id as never, { onDelete: "cascade" }),
    jobKind: cronJobKindEnum("job_kind").notNull(),
    status: cronRunStatusEnum("status").notNull().default("PENDING"),
    triggerSource: cronTriggerSourceEnum("trigger_source").notNull(),
    payload: jsonbColumn<Record<string, unknown> | null>("payload"),
    attempt: integerColumn("attempt").notNull().default(1),
    startedAt: timestampColumn("started_at").notNull().defaultNow(),
    completedAt: timestampColumn("completed_at"),
    durationMs: integerColumn("duration_ms"),
    errorMessage: textColumn("error_message"),
    errorStack: textColumn("error_stack"),
    workerId: varcharColumn("worker_id", { length: 255 }),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("cron_runs_schedule_id_status_started_at_idx").on(table.scheduleId, table.status, table.startedAt),
    index("cron_runs_status_started_at_idx").on(table.status, table.startedAt),
    index("cron_runs_worker_id_status_idx").on(table.workerId, table.status),
  ]
);

export const cronHeartbeats = createTable(
  "cron_heartbeats",
  {
    id: uuidColumn("id"),
    runId: uuidDefaultColumn("run_id")
      .notNull()
      .references(() => cronRuns.id as never, { onDelete: "cascade" }),
    workerId: varcharColumn("worker_id", { length: 255 }).notNull(),
    lastBeatAt: timestampColumn("last_beat_at").notNull().defaultNow(),
    progress: jsonbColumn<Record<string, unknown> | null>("progress"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [index("cron_heartbeats_run_id_last_beat_at_idx").on(table.runId, table.lastBeatAt)]
);
