import type { classInstancePerformance } from "../db/schema/scheduling";

export type ClassInstancePerformanceSelectType = typeof classInstancePerformance.$inferSelect;
export type ClassInstancePerformanceInsertType = typeof classInstancePerformance.$inferInsert;

export type ClassInstancePerformanceReturnType = Omit<ClassInstancePerformanceSelectType, "deletedAt" | "createdAt" | "updatedAt">;

export type ClassInstancePerformanceSubmitInput = Omit<ClassInstancePerformanceInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;
