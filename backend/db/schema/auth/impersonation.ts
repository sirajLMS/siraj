import { sql } from "drizzle-orm";
import {
  booleanColumn,
  createTable,
  index,
  inetColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { users } from "@/backend/db/schema/users/users";

export const impersonationSessions = createTable(
  "impersonation_sessions",
  {
    id: uuidColumn("id"),
    actorUserId: uuidDefaultColumn("actor_user_id")
      .notNull()
      .references(() => users.id as never, { onDelete: "restrict" }),
    targetUserId: uuidDefaultColumn("target_user_id")
      .notNull()
      .references(() => users.id as never, { onDelete: "restrict" }),
    sessionId: varcharColumn("session_id", { length: 255 }).notNull(),
    reason: textColumn("reason"),
    startedAt: timestampColumn("started_at").notNull().defaultNow(),
    endedAt: timestampColumn("ended_at"),
    ipAddress: inetColumn("ip_address"),
    userAgent: textColumn("user_agent"),
    isActive: booleanColumn("is_active").notNull().default(true),
  },
  table => [
    index("impersonation_sessions_actor_idx").on(table.actorUserId),
    index("impersonation_sessions_target_idx").on(table.targetUserId),
    index("impersonation_sessions_session_idx").on(table.sessionId),
    index("impersonation_sessions_active_actor_idx").on(table.actorUserId, table.isActive),
    index("impersonation_sessions_started_at_idx").on(table.startedAt),
    index("impersonation_sessions_ended_at_idx").on(table.endedAt),
    // Partial unique index: only one active impersonation session per actor.
    // The `= true` literal is portable: SQLite 3.23+ treats `true` as alias for 1,
    // and the boolean column is stored as 0/1 on SQLite, so the predicate matches.
    uniqueIndex("impersonation_sessions_one_active_per_actor")
      .on(table.actorUserId)
      .where(sql`${table.isActive} = true`),
  ]
);
