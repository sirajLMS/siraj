import {
  createTable,
  index,
  jsonbColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { fxProviderEnum, fxSyncStatusEnum } from "@/backend/db/schema/enums";
import { users } from "@/backend/db/schema/users/users";

export const fxSyncRuns = createTable(
  "fx_sync_runs",
  {
    id: uuidColumn("id"),
    provider: fxProviderEnum("provider").notNull(),
    status: fxSyncStatusEnum("status").notNull(),
    pairsWritten: varcharColumn("pairs_written", { length: 10 }).notNull().default("0"),
    pairsFailed: varcharColumn("pairs_failed", { length: 10 }).notNull().default("0"),
    errorMessage: varcharColumn("error_message", { length: 500 }),
    providerResponse: jsonbColumn("provider_response"),
    triggerType: varcharColumn("trigger_type", { length: 20 }).notNull(),
    triggeredByUserId: uuidDefaultColumn("triggered_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    startedAt: timestampColumn("started_at").notNull(),
    finishedAt: timestampColumn("finished_at"),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
  },
  table => [
    index("fx_sync_runs_status_idx").on(table.status),
    index("fx_sync_runs_provider_started_idx").on(table.provider, table.startedAt),
    index("fx_sync_runs_triggered_by_idx").on(table.triggeredByUserId),
    index("fx_sync_runs_started_at_idx").on(table.startedAt),
    index("fx_sync_runs_finished_at_idx").on(table.finishedAt),
    index("fx_sync_runs_trigger_type_idx").on(table.triggerType),
    index("fx_sync_runs_created_at_idx").on(table.createdAt),
  ]
);
