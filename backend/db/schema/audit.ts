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

/**
 * Generic Audit Logs table.
 * Records all changes to critical entities across the system for compliance and auditing.
 *
 * This table tracks:
 * - Student status changes
 * - Invoice modifications
 * - Payment refunds
 * - Permission changes
 * - Exchange rate updates
 * - System settings changes
 *
 * NOTE: This table is immutable. A database trigger prevents UPDATE and DELETE operations.
 * Trigger `prevent_audit_modification` will be deployed via migration.
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Actor performing the action
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorType: varchar("actor_type", { length: 50 }).notNull(), // 'USER', 'SYSTEM', 'API', 'CRON'
    // Entity being changed
    entityType: varchar("entity_type", { length: 100 }).notNull(), // 'STUDENT', 'INVOICE', 'PAYMENT', 'PERMISSION', etc.
    entityId: varchar("entity_id", { length: 255 }).notNull(), // Changed to varchar to support non-UUID entities
    // Action details
    action: varchar("action", { length: 100 }).notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'REFUND', etc.
    description: text("description"),
    // State changes
    previousState: jsonb("previous_state"), // Full or partial previous state
    newState: jsonb("new_state"), // Full or partial new state
    changes: jsonb("changes"), // Diff of what changed (optional, for convenience)
    // Context
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"), // Additional context (e.g., refund reason, approval info)
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    index("audit_logs_entity_type_idx").on(table.entityType),
    index("audit_logs_entity_id_idx").on(table.entityId),
    index("audit_logs_entity_type_id_idx").on(table.entityType, table.entityId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_actor_type_idx").on(table.actorType),
  ]
);
