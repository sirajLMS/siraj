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
