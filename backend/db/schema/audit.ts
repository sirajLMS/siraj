import { index, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: serial("id").primaryKey(),
    actorUserId: integer("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    targetUserId: integer("target_user_id").references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 100 }).notNull(),
    description: text("description"),
    previousState: jsonb("previous_state"),
    newState: jsonb("new_state"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("admin_audit_logs_actor_idx").on(table.actorUserId),
    index("admin_audit_logs_target_idx").on(table.targetUserId),
    index("admin_audit_logs_action_idx").on(table.action),
  ]
);
