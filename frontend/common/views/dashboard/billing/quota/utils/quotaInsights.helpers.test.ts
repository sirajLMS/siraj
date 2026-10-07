import { describe, expect, test } from "bun:test";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import { applyInsightsFilters } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel.helpers";
import {
  buildDeliveryRate,
  computeInsightsMetrics,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaInsights.helpers";
import { groupQuotasByMonth } from "@/frontend/common/views/dashboard/billing/quota/utils/quotaInsightsChartData";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

const mockLabels: QuotaLabels = {
  fields: {
    name: "Name",
    student: "Student",
    kind: "Type",
    status: "Status",
    totalClasses: "Total",
    remaining: "Remaining",
    reservedClasses: "Reserved",
    validFrom: "Valid From",
    validUntil: "Valid Until",
  },
  charts: {
    packageType: "Package",
    periodicType: "Periodic",
    committed: "Committed",
    cancelled: "Cancelled",
  },
} as unknown as QuotaLabels;

describe("computeInsightsMetrics", () => {
  test("computes correct metrics in single pass", () => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const mockQuotas: QuotaItem[] = [
      {
        id: "1",
        status: QuotaStatus.Active,
        remaining: 5,
        reservedClasses: 2,
        validUntil: threeDaysFromNow, // expiring this week
      },
      {
        id: "2",
        status: QuotaStatus.Active,
        remaining: 3,
        reservedClasses: 1,
        validUntil: tenDaysAgo, // overdue pending backlog
      },
      {
        id: "3",
        status: QuotaStatus.Expired,
        remaining: 0,
        reservedClasses: 0,
        validUntil: tenDaysAgo,
      },
    ];

    const result = computeInsightsMetrics(mockQuotas);

    expect(result).toEqual({
      activeCount: 2,
      totalRemaining: 8,
      totalReserved: 3,
      expiringCount: 1,
      pendingBacklogCount: 1,
    });
  });

  test("handles empty quota list gracefully", () => {
    const result = computeInsightsMetrics([]);
    expect(result).toEqual({
      activeCount: 0,
      totalRemaining: 0,
      totalReserved: 0,
      expiringCount: 0,
      pendingBacklogCount: 0,
    });
  });
});

describe("buildDeliveryRate", () => {
  test("correctly counts committed vs cancelled package quotas", () => {
    const mockQuotas: QuotaItem[] = [
      { id: "1", kind: QuotaKind.Package, status: QuotaStatus.Active },
      { id: "2", kind: QuotaKind.Package, status: QuotaStatus.Expired },
      { id: "3", kind: QuotaKind.Periodic, status: QuotaStatus.Active },
    ];

    const result = buildDeliveryRate(mockQuotas, mockLabels);

    expect(result).toEqual([
      { name: "Committed", count: 1 },
      { name: "Cancelled", count: 1 },
    ]);
  });
});

describe("groupQuotasByMonth", () => {
  test("groups quotas by month without modifying accumulator prototype or crashing", () => {
    const formatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const mockQuotas: QuotaItem[] = [
      { id: "1", createdAt: "2025-01-15T10:00:00Z", totalClasses: 10 },
      { id: "2", createdAt: "2025-01-20T10:00:00Z", totalClasses: 5 },
      { id: "3", createdAt: "2025-02-01T10:00:00Z", totalClasses: 8 },
    ];

    const result = groupQuotasByMonth(
      mockQuotas,
      q => q.createdAt ?? null,
      { purchases: 0, classes: 0 },
      (agg, q) => {
        agg.purchases += 1;
        agg.classes += q.totalClasses ?? 0;
      },
      formatter
    );

    expect(result).toHaveLength(2);
    // Alphabetical order: "Feb 2025" comes before "Jan 2025"
    expect(result[0]).toEqual(["Feb 2025", { purchases: 1, classes: 8 }]);
    expect(result[1]).toEqual(["Jan 2025", { purchases: 2, classes: 15 }]);
  });
});

describe("applyInsightsFilters", () => {
  test("returns original array reference when all filters are default/null", () => {
    const mockQuotas: QuotaItem[] = [{ id: "1", kind: QuotaKind.Package, status: QuotaStatus.Active }];

    const result = applyInsightsFilters(mockQuotas, {
      dateRange: "all",
      kind: null,
      status: null,
      studentId: null,
    });

    expect(result).toBe(mockQuotas);
  });

  test("filters by kind, status, and studentId in single pass", () => {
    const mockQuotas: QuotaItem[] = [
      { id: "1", kind: QuotaKind.Package, status: QuotaStatus.Active, studentId: "s1" },
      { id: "2", kind: QuotaKind.Periodic, status: QuotaStatus.Active, studentId: "s1" },
      { id: "3", kind: QuotaKind.Package, status: QuotaStatus.Expired, studentId: "s1" },
      { id: "4", kind: QuotaKind.Package, status: QuotaStatus.Active, studentId: "s2" },
    ];

    const result = applyInsightsFilters(mockQuotas, {
      dateRange: "all",
      kind: QuotaKind.Package,
      status: QuotaStatus.Active,
      studentId: "s1",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("1");
  });
});
