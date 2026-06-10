import type { auditLogs } from "@/backend/db/schema";

export type AuditLogEntity = typeof auditLogs.$inferSelect;
export type AuditLogEntityInput = typeof auditLogs.$inferInsert;

/**
 * Actor type for audit logs
 */
export type ActorType = "USER" | "SYSTEM" | "API" | "CRON";

/**
 * Entity types that can be audited
 */
export type AuditEntityType =
  | "STUDENT"
  | "INVOICE"
  | "PAYMENT"
  | "PERMISSION"
  | "PERMISSION_GROUP"
  | "USER_PERMISSION"
  | "EXCHANGE_RATE"
  | "SYSTEM_SETTING"
  | "USER"
  | "TEACHER"
  | "PARENT"
  | "CLASS_INSTANCE"
  | "RECURRING_SCHEDULE"
  | "LEAVE_REQUEST"
  | "COMPLAINT"
  | "LEARNING_RESOURCE";

/**
 * Action types for audit logs
 */
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
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
  | "RESTORE";

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
  logs: AuditLogEntity[];
  total: number;
  hasMore: boolean;
};
