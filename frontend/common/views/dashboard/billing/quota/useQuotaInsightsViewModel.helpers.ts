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

function insightsCutoffMs(dateRange: InsightsDateRange): number {
  if (dateRange === "all") return 0;
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
  return now.getTime();
}

function matchesInsightsFilters(q: QuotaItem, filters: QuotaInsightsFilters, cutoffMs: number): boolean {
  if (filters.kind && q.kind !== filters.kind) return false;
  if (filters.status && q.status !== filters.status) return false;
  if (filters.studentId && q.studentId !== filters.studentId) return false;
  if (filters.dateRange !== "all") {
    if (!q.createdAt) return false;
    const createdMs = Date.parse(q.createdAt);
    if (Number.isNaN(createdMs) || createdMs < cutoffMs) return false;
  }
  return true;
}

// Applies all active insight filters in a single pass over the quotas;
// returns the original array untouched when no filter is active.
export function applyInsightsFilters(quotas: QuotaItem[], filters: QuotaInsightsFilters): QuotaItem[] {
  const { dateRange, kind, status, studentId } = filters;

  if (dateRange === "all" && !kind && !status && !studentId) {
    return quotas;
  }

  const cutoffMs = insightsCutoffMs(dateRange);
  const result: QuotaItem[] = [];
  for (const q of quotas) {
    if (matchesInsightsFilters(q, filters, cutoffMs)) result.push(q);
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
    redemptionByType: buildRedemptionByType(quotas, labels.charts),
    deliveryRate: buildDeliveryRate(quotas, labels.charts),
    expiredSlippage: buildExpiredSlippage(quotas, monthFormatter),
  };
}
