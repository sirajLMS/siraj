import type { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import {
  buildDeliveryRate,
  buildExpiredSlippage,
  buildPurchasesOverTime,
  buildRedemptionByType,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaInsights.helpers";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export type InsightsDateRange = "all" | "month" | "quarter" | "year";

export interface QuotaInsightsFilters {
  readonly dateRange: InsightsDateRange;
  readonly kind: QuotaKind | null;
  readonly status: QuotaStatus | null;
  readonly studentId: string | null;
}

export interface QuotaInsightsChartData {
  readonly purchasesOverTime: { readonly month: string; readonly purchases: number; readonly classes: number }[];
  readonly redemptionByType: { readonly name: string; readonly value: number; readonly pct: number }[];
  readonly deliveryRate: { readonly name: string; readonly count: number }[];
  readonly expiredSlippage: {
    readonly month: string;
    readonly cumulativeExpired: number;
    readonly cumulativeRedeemed: number;
  }[];
}

export interface QuotaInsightsMetricsData {
  readonly activeQuotasCount: number;
  readonly totalClassesRemaining: number;
  readonly totalReserved: number;
  readonly expiringThisWeekCount: number;
  readonly pendingBacklogCount: number;
}

/**
 * Single-pass O(N) filter function for quota insights.
 * Combines dateRange, kind, status, and studentId checks into a single loop,
 * using numeric epoch ms comparisons (`Date.parse()`) and fast-path returning
 * original array when no filters are active.
 */
export function applyInsightsFilters(quotas: QuotaItem[], filters: QuotaInsightsFilters): QuotaItem[] {
  const { dateRange, kind, status, studentId } = filters;

  if (dateRange === "all" && !kind && !status && !studentId) {
    return quotas;
  }

  let cutoffMs = 0;
  if (dateRange !== "all") {
    const now = new Date();
    switch (dateRange) {
      case "month":
        now.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        now.setMonth(now.getMonth() - 3);
        break;
      case "year":
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    cutoffMs = now.getTime();
  }

  const result: QuotaItem[] = [];
  for (const q of quotas) {
    if (kind && q.kind !== kind) continue;
    if (status && q.status !== status) continue;
    if (studentId && q.studentId !== studentId) continue;
    if (dateRange !== "all") {
      if (!q.createdAt) continue;
      const createdMs = Date.parse(q.createdAt);
      if (Number.isNaN(createdMs) || createdMs < cutoffMs) continue;
    }
    result.push(q);
  }
  return result;
}

export function buildChartData(
  quotas: QuotaItem[],
  monthFormatter: Intl.DateTimeFormat,
  labels: QuotaLabels
): QuotaInsightsChartData {
  return {
    purchasesOverTime: buildPurchasesOverTime(quotas, monthFormatter),
    redemptionByType: buildRedemptionByType(quotas, labels),
    deliveryRate: buildDeliveryRate(quotas, labels),
    expiredSlippage: buildExpiredSlippage(quotas, monthFormatter),
  };
}
