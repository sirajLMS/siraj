import { ComplaintStatus } from "@/backend/enum";
import type { ComplaintAvgHoursData, ComplaintMetrics, ComplaintStatusCountData } from "@/backend/types";

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
 * Derives `ComplaintMetrics` from raw data returned by the repository.
 * This is business logic (aggregation/display formatting) that belongs in
 * the service layer, not the repository.
 */
export function deriveComplaintMetrics(
  statusCounts: ComplaintStatusCountData[],
  avgHoursData: ComplaintAvgHoursData,
  totalCountFromQueue: number
): ComplaintMetrics {
  const validStatuses = new Set<string>(Object.values(ComplaintStatus));
  const unansweredStr = ComplaintStatus.UNANSWERED as string;
  const answeredStr = ComplaintStatus.ANSWERED as string;

  let unanswered = 0;
  let answered = 0;
  let accumulatedTotal = 0;

  // Single-pass optimization: iterate through statusCounts once to calculate unanswered,
  // answered, and fallback accumulatedTotal in O(N) time with O(1) Set lookup.
  // This avoids multiple array traversals (previously 2x find with includes, plus 1x reduce).
  for (const item of statusCounts) {
    accumulatedTotal += item.count;
    if (validStatuses.has(item.status)) {
      if (item.status === unansweredStr) {
        unanswered = item.count;
      } else if (item.status === answeredStr) {
        answered = item.count;
      }
    }
  }

  const totalCount = totalCountFromQueue > 0 ? totalCountFromQueue : accumulatedTotal;

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
