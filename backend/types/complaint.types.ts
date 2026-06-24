import type { complaints } from "@/backend/db/schema";
import type { ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";
import type { ComplaintResponse } from "./complaintResponses.types";

export type ComplaintSelectType = typeof complaints.$inferSelect;
export type ComplaintInsertType = typeof complaints.$inferInsert;

// input
export type ComplaintSubmitInput = Omit<
  ComplaintInsertType,
  // enums
  | "category"
  //  forbidden
  | "status"
  | "createdAt"
  | "updatedAt"
  // resolved from mutation context
  | "parentId"
> & {
  // enums
  category: ComplaintCategory;
};

// return

export type ComplaintReturnType = Omit<
  ComplaintSelectType,
  // enums
  | "category"
  | "status"
  // forbidden
  | "deletedAt"
> & {
  // enums
  category: ComplaintCategory;
  status: ComplaintStatus;
  // resolved
  parentName?: string | null;
  studentName?: string | null;
  responseCount?: number | null;
  responses?: ReadonlyArray<ComplaintResponse> | null;
};

// custom pothos types

export type ComplaintQueueFilter = {
  search?: string | null;
  status?: ComplaintStatus | null;
  limit: number;
  offset: number;
};

export type ComplaintMetrics = {
  id: string;
  unanswered: number;
  answered: number;
  avgResolutionHours: number;
  avgResolutionTime: string | null;
  totalCount: number;
};

export type ComplaintQueueResult = {
  id: string;
  complaints: ReadonlyArray<ComplaintReturnType>;
  metrics: ComplaintMetrics;
};
