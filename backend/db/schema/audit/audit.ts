import {
  createTable,
  index,
  inetColumn,
  jsonbColumn,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { users } from "@/backend/db/schema/users/users";

// NOTE: This table is truly append-only. A database trigger deployed via
// migrations (backend/db/migration/audit_log_immutability_trigger.sql)
// raises on any UPDATE or DELETE:
//
// CREATE FUNCTION prevent_audit_log_modification() RETURNS trigger AS $$
// BEGIN
//     -- transaction-scoped maintenance escape hatch (fixture cleanup, GDPR
//     -- erasure, retention pruning) via set_config('app.audit_log_maintenance','on',true)
//     IF current_setting('app.audit_log_maintenance', true) = 'on' THEN
//         RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
//     END IF;
//     RAISE EXCEPTION 'Modifying or deleting audit logs is forbidden';
// END;
// $$ LANGUAGE plpgsql;
//
// Normal traffic never sets the maintenance GUC, so the trigger fully enforces
// immutability; the opt-in is transaction-local and cannot leak across sessions.
//
// PG-only: the immutability trigger above is a PostgreSQL plpgsql function. On
// SQLite, audit-log immutability is enforced at the repository layer (no
// update/delete methods are exposed on the audit repository).

export const adminAuditLogs = createTable(
  "admin_audit_logs",
  {
    id: uuidColumn("id"),
    actorUserId: uuidDefaultColumn("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    targetUserId: uuidDefaultColumn("target_user_id").references(() => users.id, { onDelete: "restrict" }),
    action: varcharColumn("action", { length: 100 }).notNull(),
    description: textColumn("description"),
    previousState: jsonbColumn("previous_state"),
    newState: jsonbColumn("new_state"),
    ipAddress: inetColumn("ip_address"),
    createdAt: timestampColumn("created_at").notNull(),
  },
  table => [
    index("admin_audit_logs_actor_idx").on(table.actorUserId),
    index("admin_audit_logs_target_idx").on(table.targetUserId),
    index("admin_audit_logs_action_idx").on(table.action),
    index("admin_audit_logs_created_at_idx").on(table.createdAt),
    index("admin_audit_logs_ip_address_idx").on(table.ipAddress),
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
 * PG-only: on SQLite, immutability is enforced at the repository layer.
 */
export const auditLogs = createTable(
  "audit_logs",
  {
    id: uuidColumn("id"),
    // Actor performing the action
    actorUserId: uuidDefaultColumn("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorType: varcharColumn("actor_type", { length: 50 }).notNull(), // 'USER', 'SYSTEM', 'API', 'CRON'
    // Entity being changed
    entityType: varcharColumn("entity_type", { length: 100 }).notNull(), // 'STUDENT', 'INVOICE', 'PAYMENT', 'PERMISSION', etc.
    entityId: varcharColumn("entity_id", { length: 255 }).notNull(), // Changed to varchar to support non-UUID entities
    // Action details
    action: varcharColumn("action", { length: 100 }).notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'REFUND', etc.
    description: textColumn("description"),
    // State changes
    previousState: jsonbColumn("previous_state"), // Full or partial previous state
    newState: jsonbColumn("new_state"), // Full or partial new state
    changes: jsonbColumn("changes"), // Diff of what changed (optional, for convenience)
    // Context
    ipAddress: inetColumn("ip_address"),
    userAgent: textColumn("user_agent"),
    metadata: jsonbColumn("metadata"), // Additional context (e.g., refund reason, approval info)
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
  },
  table => [
    index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    index("audit_logs_entity_type_idx").on(table.entityType),
    index("audit_logs_entity_id_idx").on(table.entityId),
    index("audit_logs_entity_type_id_idx").on(table.entityType, table.entityId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_actor_type_idx").on(table.actorType),
    index("audit_logs_entity_type_entity_id_created_at_idx").on(table.entityType, table.entityId, table.createdAt),
    index("audit_logs_actor_user_id_created_at_idx").on(table.actorUserId, table.createdAt),
    index("audit_logs_action_created_at_idx").on(table.action, table.createdAt),
  ]
);
