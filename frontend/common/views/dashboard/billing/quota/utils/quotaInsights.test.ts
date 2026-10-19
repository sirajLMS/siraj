import { describe, expect, it } from "bun:test";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import {
  applyInsightsFilters,
  type QuotaInsightsFilters,
} from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel.helpers";
import {
  buildDeliveryRate,
  buildExpiredSlippage,
  computeInsightsMetrics,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaInsights.helpers";
import { groupQuotasByMonth } from "@/frontend/common/views/dashboard/billing/quota/utils/quotaInsightsChartData";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

const chartsLabels: Pick<QuotaLabels["charts"], "committed" | "cancelled"> = {
  committed: "Committed",
  cancelled: "Cancelled",
};

const now = new Date();
const pastDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days from now
const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days from now

const createQuota = (overrides: Partial<QuotaItem> = {}): QuotaItem => ({
  id: "q1",
  studentId: "s1",
  name: "Test Quota",
  kind: QuotaKind.Package,
  totalClasses: 10,
  remaining: 5,
  reservedClasses: 2,
  validFrom: pastDate,
  validUntil: in3Days,
  status: QuotaStatus.Active,
  periodType: null,
  periodDays: null,
  priority: null,
  createdAt: pastDate,
  updatedAt: pastDate,
  ...overrides,
});

describe("computeInsightsMetrics", () => {
  it("computes correct aggregate metrics from quota list", () => {
    const quotas: QuotaItem[] = [
      createQuota({ id: "1", status: QuotaStatus.Active, remaining: 5, reservedClasses: 1, validUntil: in3Days }),
      createQuota({ id: "2", status: QuotaStatus.Active, remaining: 3, reservedClasses: 2, validUntil: pastDate }), // backlog
      createQuota({ id: "3", status: QuotaStatus.Expired, remaining: 0, reservedClasses: 0, validUntil: pastDate }),
      createQuota({ id: "4", status: QuotaStatus.Active, remaining: 10, reservedClasses: 0, validUntil: in10Days }),
    ];

    const metrics = computeInsightsMetrics(quotas);

    expect(metrics.activeCount).toBe(3);
    expect(metrics.totalRemaining).toBe(18);
    expect(metrics.totalReserved).toBe(3);
    expect(metrics.expiringCount).toBe(1); // item 1 expires in 3 days
    expect(metrics.pendingBacklogCount).toBe(1); // item 2 is active, has remaining > 0, validUntil < now
  });

  it("handles empty quota list", () => {
    const metrics = computeInsightsMetrics([]);
    expect(metrics).toEqual({
      activeCount: 0,
      totalRemaining: 0,
      totalReserved: 0,
      expiringCount: 0,
      pendingBacklogCount: 0,
    });
  });
});

describe("buildDeliveryRate", () => {
  it("counts active and non-active package quotas", () => {
    const quotas: QuotaItem[] = [
      createQuota({ kind: QuotaKind.Package, status: QuotaStatus.Active }),
      createQuota({ kind: QuotaKind.Package, status: QuotaStatus.Active }),
      createQuota({ kind: QuotaKind.Package, status: QuotaStatus.Expired }),
      createQuota({ kind: QuotaKind.Periodic, status: QuotaStatus.Active }), // ignored
    ];

    const result = buildDeliveryRate(quotas, chartsLabels);

    expect(result).toEqual([
      { name: "Committed", count: 2 },
      { name: "Cancelled", count: 1 },
    ]);
  });
});

describe("groupQuotasByMonth and buildExpiredSlippage", () => {
  it("groups quotas by month correctly", () => {
    const dtf = new Intl.DateTimeFormat("en", { month: "short" });
    const quotas: QuotaItem[] = [
      createQuota({ validUntil: "2025-01-15T00:00:00Z", status: QuotaStatus.Expired, remaining: 2 }),
      createQuota({ validUntil: "2025-01-20T00:00:00Z", status: QuotaStatus.Active, totalClasses: 10, remaining: 6 }),
    ];

    const entries = groupQuotasByMonth(
      quotas,
      q => q.validUntil,
      { expired: 0, redeemed: 0 },
      (agg, q) => {
        if (q.status === QuotaStatus.Expired) agg.expired += q.remaining ?? 0;
        if (q.status === QuotaStatus.Active) agg.redeemed += (q.totalClasses ?? 0) - (q.remaining ?? 0);
      },
      dtf
    );

    expect(entries).toHaveLength(1);
    expect(entries[0][1]).toEqual({ expired: 2, redeemed: 4 });

    const slippage = buildExpiredSlippage(quotas, dtf);
    expect(slippage).toHaveLength(1);
    expect(slippage[0]).toEqual({
      month: entries[0][0],
      cumulativeExpired: 2,
      cumulativeRedeemed: 4,
    });
  });
});

describe("applyInsightsFilters", () => {
  it("filters quotas by status, kind, studentId, and dateRange", () => {
    const recentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();

    const quotas: QuotaItem[] = [
      createQuota({
        id: "1",
        kind: QuotaKind.Package,
        status: QuotaStatus.Active,
        studentId: "s1",
        createdAt: recentDate,
      }),
      createQuota({
        id: "2",
        kind: QuotaKind.Periodic,
        status: QuotaStatus.Active,
        studentId: "s1",
        createdAt: recentDate,
      }),
      createQuota({
        id: "3",
        kind: QuotaKind.Package,
        status: QuotaStatus.Expired,
        studentId: "s2",
        createdAt: oldDate,
      }),
    ];

    const filtersNoOp: QuotaInsightsFilters = {
      dateRange: "all",
      kind: null,
      status: null,
      studentId: null,
    };
    expect(applyInsightsFilters(quotas, filtersNoOp)).toHaveLength(3);

    const filterKind: QuotaInsightsFilters = { ...filtersNoOp, kind: QuotaKind.Package };
    expect(applyInsightsFilters(quotas, filterKind)).toHaveLength(2);

    const filterStatus: QuotaInsightsFilters = { ...filtersNoOp, status: QuotaStatus.Expired };
    expect(applyInsightsFilters(quotas, filterStatus)).toHaveLength(1);

    const filterStudent: QuotaInsightsFilters = { ...filtersNoOp, studentId: "s1" };
    expect(applyInsightsFilters(quotas, filterStudent)).toHaveLength(2);

    const filterMonth: QuotaInsightsFilters = { ...filtersNoOp, dateRange: "month" };
    expect(applyInsightsFilters(quotas, filterMonth)).toHaveLength(2);
  });
});
