import type { auditLogs } from "@/backend/db/schema";

export type AuditLogSelectType = typeof auditLogs.$inferSelect;
export type AuditLogInsertType = typeof auditLogs.$inferInsert;

export type AuditLogReturnType = Omit<AuditLogSelectType, "deletedAt">;

export type AuditLogSubmitInput = Omit<AuditLogInsertType, "id" | "createdAt" | "actorUserId">;

/**
 * Actor type for audit logs
 */
export type ActorType = "USER" | "SYSTEM" | "API" | "CRON" | "TEACHER" | "PARENT";

/**
 * Entity types that can be audited
 */
export type AuditEntityType =
  | "SYSTEM"
  | "STUDENT"
  | "INVOICE"
  | "PAYMENT"
  | "PERMISSION"
  | "PERMISSION_GROUP"
  | "USER_PERMISSION"
  | "EXCHANGE_RATE"
  | "SYSTEM_SETTING"
  | "SITE_CONTENT"
  | "SESSION_CONFIG"
  | "ENV_CONFIG"
  | "USER"
  | "TEACHER"
  | "PARENT"
  | "CLASS_INSTANCE"
  | "RECURRING_SCHEDULE"
  | "LEAVE_REQUEST"
  | "COMPLAINT"
  | "LEARNING_RESOURCE"
  | "SUGGESTION"
  | "BOOK"
  | "MEETING_PROVIDER_TOKEN"
  | "WHATSAPP_ACCOUNT";

/**
 * Action types for audit logs
 */
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "UPSERT"
  | "STATUS_CHANGE"
  | "REFUND"
  | "GRANT"
  | "REVOKE"
  | "ASSIGN"
  | "UNASSIGN"
  | "APPROVE"
  | "REJECT"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "RESTORE"
  | "TEACHER_SUPPORT_REQUEST"
  | "WHATSAPP_OPT_IN";

/**
 * Input for creating an audit log entry
 */
export type CreateAuditLogInput = {
  actorUserId?: string | null;
  actorType: ActorType;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  description?: string | null;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
};

/**
 * Filter options for querying audit logs
 */
export type AuditLogFilterInput = {
  actorUserId?: string;
  actorType?: ActorType;
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
};

/**
 * Result of audit log query with pagination
 */
export type AuditLogQueryResult = {
  logs: AuditLogReturnType[];
  total: number;
  hasMore: boolean;
};

/** Input for creating admin audit log entries (append-only). */
export type CreateAdminAuditLogInput = {
  readonly actorUserId: string;
  readonly targetUserId?: string | null;
  readonly action: string;
  readonly description?: string | null;
  readonly previousState?: Record<string, unknown> | null;
  readonly newState?: Record<string, unknown> | null;
  readonly ipAddress?: string | null;
  readonly createdAt?: Date;
};

// Single-source const arrays for runtime validation (derived from the unions above).
export const AUDIT_ENTITY_TYPE_VALUES = [
  "SYSTEM",
  "STUDENT",
  "INVOICE",
  "PAYMENT",
  "PERMISSION",
  "PERMISSION_GROUP",
  "USER_PERMISSION",
  "EXCHANGE_RATE",
  "SYSTEM_SETTING",
  "SITE_CONTENT",
  "SESSION_CONFIG",
  "ENV_CONFIG",
  "USER",
  "TEACHER",
  "PARENT",
  "CLASS_INSTANCE",
  "RECURRING_SCHEDULE",
  "LEAVE_REQUEST",
  "COMPLAINT",
  "LEARNING_RESOURCE",
  "SUGGESTION",
  "BOOK",
  "MEETING_PROVIDER_TOKEN",
  "WHATSAPP_ACCOUNT",
] as const satisfies readonly AuditEntityType[];

export const AUDIT_ACTION_VALUES = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "UPSERT",
  "STATUS_CHANGE",
  "REFUND",
  "GRANT",
  "REVOKE",
  "ASSIGN",
  "UNASSIGN",
  "APPROVE",
  "REJECT",
  "ACTIVATE",
  "DEACTIVATE",
  "RESTORE",
  "TEACHER_SUPPORT_REQUEST",
  "WHATSAPP_OPT_IN",
] as const satisfies readonly AuditAction[];
