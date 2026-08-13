import type {
  books,
  classInstances,
  complaints,
  invoices,
  learningResources,
  recurringSchedules,
  suggestions,
  users,
} from "@/backend/db/schema";
import type { AuditEntityType } from "@/backend/types";

export type SoftDeletableTableName =
  | "users"
  | "recurring_schedules"
  | "class_instances"
  | "complaints"
  | "learning_resources"
  | "invoices"
  | "suggestions"
  | "books";

export type SoftDeleteInput = {
  tableName: SoftDeletableTableName;
  entityId: string;
  actorUserId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type SoftDeleteResult<T> = {
  entity: T;
  deletedAt: Date;
};

export type SoftDeletableEntityMap = {
  users: typeof users.$inferSelect;
  recurring_schedules: typeof recurringSchedules.$inferSelect;
  class_instances: typeof classInstances.$inferSelect;
  complaints: typeof complaints.$inferSelect;
  learning_resources: typeof learningResources.$inferSelect;
  invoices: typeof invoices.$inferSelect;
  suggestions: typeof suggestions.$inferSelect;
  books: typeof books.$inferSelect;
};

export type SoftDeletableAuditEntityMap = {
  users: Extract<AuditEntityType, "USER">;
  recurring_schedules: Extract<AuditEntityType, "RECURRING_SCHEDULE">;
  class_instances: Extract<AuditEntityType, "CLASS_INSTANCE">;
  complaints: Extract<AuditEntityType, "COMPLAINT">;
  learning_resources: Extract<AuditEntityType, "LEARNING_RESOURCE">;
  invoices: Extract<AuditEntityType, "INVOICE">;
  suggestions: Extract<AuditEntityType, "SUGGESTION">;
  books: Extract<AuditEntityType, "BOOK">;
};
