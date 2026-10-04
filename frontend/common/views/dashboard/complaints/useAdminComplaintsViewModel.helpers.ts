import type {
  AdminComplaintQueueQuery_adminComplaintQueue_metrics,
  PaginationArgs,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { AdminComplaintsSummary } from "@/frontend/common/views/dashboard/complaints/types/complaints.types";

/** Translates the 0-based UI page into the 1-based server pagination window. */
export function buildAdminComplaintsPaginationArgs(page: number, pageSize: number): PaginationArgs {
  return {
    first: pageSize,
    page: page + 1,
    after: null,
    before: null,
    last: null,
    maxCount: null,
    skip: null,
  };
}

export function buildAdminComplaintsSummary(
  metrics: AdminComplaintQueueQuery_adminComplaintQueue_metrics | null | undefined
): AdminComplaintsSummary {
  return metrics
    ? {
        unanswered: metrics.unanswered ?? 0,
        answered: metrics.answered ?? 0,
        avgResolutionHours: metrics.avgResolutionTime ?? "0.0 Hours",
      }
    : { unanswered: 0, answered: 0, avgResolutionHours: "0.0 Hours" };
}
