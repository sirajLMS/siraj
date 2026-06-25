import type { complaints } from "@/backend/db/schema";
import type { ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";
import type { ComplaintResponse } from "./complaintResponses.types";

export type ComplaintSelectType = typeof complaints.$inferSelect;
export type ComplaintInsertType = typeof complaints.$inferInsert;

export type ComplaintSubmitInput = Omit<
  ComplaintInsertType,
  // enums
  | "category"
  //  forbidden
  | "status"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  // resolved from mutation context
  | "parentId"
> & {
  // enums
  category: ComplaintCategory;
};

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
  files?: ReadonlyArray<ComplaintFileReturnType> | null;
};

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

export type ComplaintFileReturnType = {
  fileId: string;
  filePath: string;
  isProtected: boolean;
  usageType: string;
  createdAt: Date;
};

export type FileMetadata = {
  readonly path: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
};

export type ComplaintSubmitWithFilesInput = ComplaintSubmitInput & {
  files?: ReadonlyArray<FileMetadata>;
};
