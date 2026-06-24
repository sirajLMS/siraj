import type { complaints } from "@/backend/db/schema";
import type { ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";
import type { ComplaintResponseWithResponderType } from "./complaintResponses,types";

export type ComplaintSelectType = typeof complaints.$inferSelect;
export type ComplaintInsertType = typeof complaints.$inferInsert;

// input
export type ComplaintSubmitInput = Omit<ComplaintInsertType, "createdAt" | "updatedAt" | "category" | "status"> & {
  category: ComplaintCategory;
};

export type ComplaintPothosType = Omit<ComplaintSelectType, "category" | "status"> & {
  // enums
  category: ComplaintCategory;
  status: ComplaintStatus;
  // resolved
  parentName: string;
  studentName: string | null;
  responses: ReadonlyArray<ComplaintResponsePothosType>;
};

export type SubmitComplaintInputPothosType = Pick<ComplaintInsertType, "studentId" | "submitterEmail" | "body"> & {
  category: ComplaintCategory;
};

export type ComplaintQueueRowPothosType = Omit<ComplaintSelectType, "category" | "status" | "deletedAt"> & {
  // enums
  category: ComplaintCategory;
  status: ComplaintStatus;
  // resolved
  parentName: string;
  studentName: string | null;
  responseCount: number;
};

export type ParentComplaintRecordPothosType = Pick<ComplaintSelectType, "id" | "body" | "createdAt"> & {
  category: ComplaintCategory;
  status: ComplaintStatus;
  studentName: string | null;
  responses: ReadonlyArray<ComplaintResponsePothosType>;
};

export type ComplaintQueueFilterPothosType = {
  search?: string | null;
  status?: ComplaintStatus | null;
  limit: number;
  offset: number;
};

// custom pothos types

export type ComplaintMetricsPothosType = {
  id: string;
  unanswered: number;
  answered: number;
  avgResolutionTime: string | null;
};

export type AdminComplaintQueueResultPothosType = {
  id: string;
  rows: ReadonlyArray<ComplaintQueueRowPothosType>;
  metrics: ComplaintMetricsPothosType;
  totalCount: number;
};

export type ComplaintResponsePothosType = {
  id: string;
  complaintId: string;
  responderUserId: string | null;
  body: string;
  emailSent: boolean;
  createdAt: Date;
  responderName: string | null;
};

export type ComplaintWithResponsesType = {
  id: string;
  parentId: string;
  studentId: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
  studentName: string | null;
  responses: ReadonlyArray<ComplaintResponseWithResponderType>;
};

export type ComplaintMetricsType = {
  id: string;
  unanswered: number;
  answered: number;
  avgResolutionHours: number;
};

export type AdminComplaintQueueResultType = {
  complaints: ReadonlyArray<ComplaintQueueRowType>;
  totalCount: number;
  metrics: ComplaintMetricsType;
};

export type SubmitComplaintInputType = Pick<ComplaintInsertType, "studentId" | "body" | "submitterEmail"> & {
  category: ComplaintCategory;
};

export type ComplaintQueueRowType = ComplaintSelectType & {
  id: string;
  parentId: string;
  studentId: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
  parentName: string | null;
  studentName: string | null;
  responseCount: number;
};

export type AdminQueueOptions = {
  readonly limit: number;
  readonly offset: number;
  readonly statusFilter?: string | null;
  readonly search?: string | null;
};

export type AdminComplaintQueueResult = {
  rows: ComplaintQueueRowType[];
  totalCount: number;
};

export type ComplaintMetrics = {
  unanswered: number;
  answered: number;
  avgResolutionHours: number;
};
