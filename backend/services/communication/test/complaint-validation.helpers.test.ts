import { describe, expect, it } from "bun:test";
import { ComplaintStatus } from "@/backend/enum";
import { deriveComplaintMetrics } from "@/backend/services/communication/complaint-validation.helpers";

describe("deriveComplaintMetrics performance-optimized function", () => {
  it("derives metrics correctly with valid statuses and statusCounts", () => {
    const statusCounts = [
      { status: ComplaintStatus.UNANSWERED, count: 5 },
      { status: ComplaintStatus.ANSWERED, count: 12 },
      { status: ComplaintStatus.RESOLVED, count: 3 },
    ];
    const avgHoursData = { avgHours: 10.5 };
    const totalCountFromQueue = 0;

    const result = deriveComplaintMetrics(statusCounts, avgHoursData, totalCountFromQueue);

    expect(result).toEqual({
      id: "complaint-metrics",
      unanswered: 5,
      answered: 12,
      avgResolutionHours: 10.5,
      avgResolutionTime: "11h",
      totalCount: 20,
    });
  });

  it("uses totalCountFromQueue when greater than 0", () => {
    const statusCounts = [
      { status: ComplaintStatus.UNANSWERED, count: 5 },
      { status: ComplaintStatus.ANSWERED, count: 12 },
    ];
    const avgHoursData = { avgHours: 25.0 };
    const totalCountFromQueue = 100;

    const result = deriveComplaintMetrics(statusCounts, avgHoursData, totalCountFromQueue);

    expect(result.totalCount).toBe(100);
    expect(result.avgResolutionTime).toBe("1d 1h");
  });

  it("handles empty statusCounts and null avgHours gracefully", () => {
    const statusCounts: Array<{ status: string; count: number }> = [];
    const avgHoursData = { avgHours: null };

    const result = deriveComplaintMetrics(statusCounts, avgHoursData, 0);

    expect(result).toEqual({
      id: "complaint-metrics",
      unanswered: 0,
      answered: 0,
      avgResolutionHours: 0,
      avgResolutionTime: null,
      totalCount: 0,
    });
  });
});
