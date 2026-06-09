import { index, inet, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

// NOTE: This table is truly append-only. The following SQL trigger has been deployed via migrations:
// CREATE FUNCTION prevent_audit_modification() RETURNS trigger AS $$
// BEGIN
//     RAISE EXCEPTION 'Modifying or deleting audit logs is forbidden';
// END;
// $$ LANGUAGE plpgsql;
//
// CREATE TRIGGER prevent_audit_mod_trigger
// BEFORE UPDATE OR DELETE ON admin_audit_logs
// FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 100 }).notNull(),
    description: text("description"),
    previousState: jsonb("previous_state"),
    newState: jsonb("new_state"),
    ipAddress: inet("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("admin_audit_logs_actor_idx").on(table.actorUserId),
    index("admin_audit_logs_target_idx").on(table.targetUserId),
    index("admin_audit_logs_action_idx").on(table.action),
  ]
);
