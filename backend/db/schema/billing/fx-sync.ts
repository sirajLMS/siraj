import { index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { fxProviderEnum, fxSyncStatusEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";

export const fxSyncRuns = pgTable(
  "fx_sync_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: fxProviderEnum("provider").notNull(),
    status: fxSyncStatusEnum("status").notNull(),
    pairsWritten: varchar("pairs_written", { length: 10 }).notNull().default("0"),
    pairsFailed: varchar("pairs_failed", { length: 10 }).notNull().default("0"),
    errorMessage: varchar("error_message", { length: 500 }),
    providerResponse: jsonb("provider_response"),
    triggerType: varchar("trigger_type", { length: 20 }).notNull(),
    triggeredByUserId: uuid("triggered_by_user_id").references(() => users.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at", { withTimezone: true, precision: 3 }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("fx_sync_runs_status_idx").on(table.status),
    index("fx_sync_runs_provider_started_idx").on(table.provider, table.startedAt),
    index("fx_sync_runs_triggered_by_idx").on(table.triggeredByUserId),
  ]
);
