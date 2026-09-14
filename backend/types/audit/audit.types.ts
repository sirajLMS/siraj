import type { auditLogs } from "@/backend/db/schema";

export type AuditLogSelectType = typeof auditLogs.$inferSelect;
export type AuditLogReturnType = Omit<AuditLogSelectType, "deletedAt">;

/**
 * Actor type for audit logs
 */
type ActorType = "USER" | "SYSTEM" | "API" | "CRON" | "TEACHER" | "PARENT";

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
  | "WHATSAPP_ACCOUNT"
  | "CARRYOVER_BALANCE"
  | "EXPENSE";

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
  | "WHATSAPP_OPT_IN"
  | "CARRYOVER_CREATE"
  | "CARRYOVER_TO_EXPENSE"
  | "CARRYOVER_UNPAID"
  | "CARRYOVER_DELETE"
  | "EXPENSE_CREATE"
  | "EXPENSE_UPDATE"
  | "EXPENSE_DELETE";

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
 * Filter options for the Settings → Audit tab query. Mirrors the GraphQL
 * `SettingsAuditLogFilter` input, where absent arguments arrive as `null`
 * (unlike {@link AuditLogFilterInput}, whose fields are plain optionals).
 * Entity/action values are raw strings at this boundary; the resolver narrows
 * them to the canonical union types before calling the service.
 */
export type SettingsAuditLogFilterInput = {
  entityType?: string | null;
  action?: string | null;
  actorUserId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  limit?: number | null;
  offset?: number | null;
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
