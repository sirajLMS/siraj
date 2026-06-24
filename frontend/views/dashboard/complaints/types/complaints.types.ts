import { ComplaintCategory, ComplaintStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  Complaint,
  ComplaintMetrics,
  ComplaintQueueFilter,
  ComplaintQueueResult,
  ComplaintResponse,
  ComplaintSubmitInput,
} from "@/frontend/graphql/generated/gql/graphql-types";

// Re-export generated GQL types and enums
export { ComplaintStatus, ComplaintCategory };
export type {
  Complaint,
  ComplaintMetrics,
  ComplaintQueueFilter,
  ComplaintQueueResult,
  ComplaintResponse,
  ComplaintSubmitInput,
};

// UI/Mock-specific view types (used by mock store and views)
export type ComplaintTab = ComplaintStatus;

export type ComplaintPriority = "urgent" | "general";

export type ParentComplaintRecordStatus = ComplaintStatus;

export interface ParentComplaintRecordResponse {
  readonly text: string;
  readonly answeredAt: string;
}

export interface ParentComplaintRecord {
  readonly id: string;
  readonly regarding: string;
  readonly summary: string;
  readonly status: ParentComplaintRecordStatus;
  readonly adminResponse?: ParentComplaintRecordResponse;
}

export interface ParentStudentOption {
  readonly id: string;
  readonly label: string;
}

export interface AdminComplaintsSummary {
  readonly unanswered: number;
  readonly answered: number;
  readonly avgResolutionHours: string;
}

export interface AdminComplaintRow {
  readonly id: string;
  readonly submitterName: string;
  readonly submitterRole: string;
  readonly avatarUrl?: string;
  readonly priority: ComplaintPriority;
  readonly receivedAt: string;
  readonly complaintText: string;
  readonly status: ComplaintStatus;
  readonly adminResponse?: string;
  readonly answeredAt?: string;
}
