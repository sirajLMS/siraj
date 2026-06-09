import type { parents } from "@/backend/db/schema";

export type ParentEntity = typeof parents.$inferSelect;
export type ParentEntityInput = typeof parents.$inferInsert;
