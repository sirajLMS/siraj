import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { classInstancePerformance } from "../db/schema/scheduling";

export type ClassInstancePerformanceSelectType = InferSelectModel<typeof classInstancePerformance>;
export type ClassInstancePerformanceInsertType = InferInsertModel<typeof classInstancePerformance>;
