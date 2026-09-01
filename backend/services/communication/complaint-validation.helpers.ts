import { ComplaintStatus } from "@/backend/enum";
import type { ComplaintMetrics } from "@/backend/types";

/**
 * Display formatting — converts hours to a human-readable duration string.
 * Moved from complaint.repository.ts to the service layer (business logic).
 */
function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  } else if (hours < 24) {
    return `${Math.round(hours)}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  }
}

/**
 * Raw status count data returned by the repository layer.
 * The service layer uses this to derive the final `ComplaintMetrics`.
 */
export interface ComplaintStatusCountData {
  status: string;
  count: number;
}

export interface ComplaintAvgHoursData {
  avgHours: number | null;
}

/**
 * Derives `ComplaintMetrics` from raw data returned by the repository.
 * This is business logic (aggregation/display formatting) that belongs in
 * the service layer, not the repository.
 */
export function deriveComplaintMetrics(
  statusCounts: ComplaintStatusCountData[],
  avgHoursData: ComplaintAvgHoursData,
  totalCountFromQueue: number
): ComplaintMetrics {
  const validStatuses = Object.values(ComplaintStatus) as readonly string[];
  const unansweredStr = ComplaintStatus.UNANSWERED as string;
  const answeredStr = ComplaintStatus.ANSWERED as string;
  const unanswered = statusCounts.find(r => validStatuses.includes(r.status) && r.status === unansweredStr)?.count ?? 0;
  const answered = statusCounts.find(r => validStatuses.includes(r.status) && r.status === answeredStr)?.count ?? 0;
  const totalCount = totalCountFromQueue > 0 ? totalCountFromQueue : statusCounts.reduce((sum, r) => sum + r.count, 0);

  const avgResolutionHours = Math.round((avgHoursData.avgHours ?? 0) * 100) / 100;
  const avgResolutionTime = avgResolutionHours > 0 ? formatDuration(avgResolutionHours) : null;

  return {
    id: "complaint-metrics",
    unanswered,
    answered,
    avgResolutionHours,
    avgResolutionTime,
    totalCount,
  };
}
