import { sql } from "drizzle-orm";
import { boolean, index, inet, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "@/backend/db/schema/users/users";

export const impersonationSessions = pgTable(
  "impersonation_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    reason: text("reason"),
    startedAt: timestamp("started_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true, precision: 3 }),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    isActive: boolean("is_active").notNull().default(true),
  },
  table => [
    index("impersonation_sessions_actor_idx").on(table.actorUserId),
    index("impersonation_sessions_target_idx").on(table.targetUserId),
    index("impersonation_sessions_session_idx").on(table.sessionId),
    index("impersonation_sessions_active_actor_idx").on(table.actorUserId, table.isActive),
    index("impersonation_sessions_started_at_idx").on(table.startedAt),
    index("impersonation_sessions_ended_at_idx").on(table.endedAt),
    uniqueIndex("impersonation_sessions_one_active_per_actor")
      .on(table.actorUserId)
      .where(sql`${table.isActive} = true`),
  ]
);
