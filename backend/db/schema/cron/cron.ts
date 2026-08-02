import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import {
  cronConcurrencyPolicyEnum,
  cronJobKindEnum,
  cronRunStatusEnum,
  cronScheduleStatusEnum,
  cronTriggerSourceEnum,
} from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";

export const cronSchedules = pgTable(
  "cron_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    cronExpression: varchar("cron_expression", { length: 255 }).notNull(),
    jobKind: cronJobKindEnum("job_kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
    status: cronScheduleStatusEnum("status").notNull().default("ACTIVE"),
    timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
    nextRunAt: timestamp("next_run_at", { withTimezone: true, precision: 3 }),
    lastRunAt: timestamp("last_run_at", { withTimezone: true, precision: 3 }),
    concurrencyPolicy: cronConcurrencyPolicyEnum("concurrency_policy").notNull().default("ALLOW"),
    maxRetries: integer("max_retries").notNull().default(3),
    retryBackoffSeconds: integer("retry_backoff_seconds").notNull().default(60),
    timeoutSeconds: integer("timeout_seconds").notNull().default(300),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
  },
  table => [
    index("cron_schedules_status_next_run_at_idx").on(table.status, table.nextRunAt),
    uniqueIndex("cron_schedules_name_unique_idx").on(table.name).where(sql`${table.status} IN ('ACTIVE', 'PAUSED')`),
    index("cron_schedules_job_kind_idx").on(table.jobKind),
  ]
);

export const cronRuns = pgTable(
  "cron_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => cronSchedules.id, { onDelete: "cascade" }),
    jobKind: cronJobKindEnum("job_kind").notNull(),
    status: cronRunStatusEnum("status").notNull().default("PENDING"),
    triggerSource: cronTriggerSourceEnum("trigger_source").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
    attempt: integer("attempt").notNull().default(1),
    startedAt: timestamp("started_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true, precision: 3 }),
    durationMs: integer("duration_ms"),
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),
    workerId: varchar("worker_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("cron_runs_schedule_id_status_started_at_idx").on(table.scheduleId, table.status, table.startedAt),
    index("cron_runs_status_started_at_idx").on(table.status, table.startedAt),
    index("cron_runs_worker_id_status_idx").on(table.workerId, table.status),
  ]
);

export const cronHeartbeats = pgTable(
  "cron_heartbeats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => cronRuns.id, { onDelete: "cascade" }),
    workerId: varchar("worker_id", { length: 255 }).notNull(),
    lastBeatAt: timestamp("last_beat_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    progress: jsonb("progress").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [index("cron_heartbeats_run_id_last_beat_at_idx").on(table.runId, table.lastBeatAt)]
);
