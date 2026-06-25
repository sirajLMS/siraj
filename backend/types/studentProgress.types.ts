import type { studentProgress } from "@/backend/db/schema";

export type StudentProgressSelectType = typeof studentProgress.$inferSelect;
export type StudentProgressInsertType = typeof studentProgress.$inferInsert;
