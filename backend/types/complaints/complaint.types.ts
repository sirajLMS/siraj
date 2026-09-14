import type { complaints } from "@/backend/db/schema";
import type { ComplaintCategory, ComplaintStatus } from "@/backend/enum";
import type { ComplaintResponseReturnType, PageInfo } from "@/backend/types";

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
  // PII / internal FKs — not exposed via API
  | "parentId"
  | "studentId"
  | "submitterEmail"
> & {
  // enums
  category: ComplaintCategory;
  status: ComplaintStatus;
  // resolved
  parentName?: string | null;
  parentAvatarUrl?: string | null;
  studentName?: string | null;
  responseCount?: number | null;
  responses?: ReadonlyArray<ComplaintResponseReturnType> | null;
  files?: ReadonlyArray<ComplaintFileReturnType> | null;
};

export type ComplaintQueueFilter = {
  search?: string | null;
  status?: ComplaintStatus | null;
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
  totalCount?: number | null;
  pageInfo?: PageInfo | null;
};

export type ComplaintStatusCountData = {
  status: string;
  count: number;
};

export type ComplaintAvgHoursData = {
  avgHours: number | null;
};

export type ComplaintQueueRawResult = {
  id: string;
  complaints: ReadonlyArray<ComplaintReturnType>;
  rawMetrics: { statusCounts: ComplaintStatusCountData[]; avgResolutionHours: number };
};

export type ComplaintQueuePaginatedResult = {
  rows: ReadonlyArray<ComplaintReturnType>;
  totalCount: number;
  pageInfo: PageInfo | null;
};

export type ComplaintFileReturnType = {
  fileId: string;
  publicUrl: string;
  isProtected: boolean;
  usageType: string;
  createdAt: Date;
};

export type FileMetadata = {
  readonly path: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
};

/**
 * GraphQL input shape for complaint file metadata (pre-uploaded attachment).
 * Same structural shape as {@link FileMetadata} but named for Pothos inputRef use.
 */
export type ComplaintFileMetadataInput = {
  readonly path: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
};

export type ParentComplaintPaginatedResult = {
  readonly id: string;
  readonly complaints: ReadonlyArray<ComplaintReturnType>;
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
};

export type ComplaintSubmitWithFilesInput = ComplaintSubmitInput & {
  files?: ReadonlyArray<FileMetadata>;
};
