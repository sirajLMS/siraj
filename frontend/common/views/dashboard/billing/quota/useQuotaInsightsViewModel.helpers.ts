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

// Single-pass filter evaluates all filter conditions concurrently with epoch timestamp comparisons,
// avoiding up to 4 chained filter function allocations and multi-pass array scanning.
export function applyInsightsFilters(quotas: QuotaItem[], filters: QuotaInsightsFilters): QuotaItem[] {
  const { dateRange, kind, status, studentId } = filters;
  if (dateRange === "all" && !kind && !status && !studentId) {
    return quotas;
  }

  let cutoffMs = 0;
  if (dateRange !== "all") {
    const cutoffDate = new Date();
    if (dateRange === "month") {
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    } else if (dateRange === "quarter") {
      cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    } else if (dateRange === "year") {
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    }
    cutoffMs = cutoffDate.getTime();
  }

  return quotas.filter(q => {
    if (kind && q.kind !== kind) return false;
    if (status && q.status !== status) return false;
    if (studentId && q.studentId !== studentId) return false;
    if (cutoffMs > 0) {
      if (!q.createdAt) return false;
      const createdMs = Date.parse(q.createdAt);
      if (Number.isNaN(createdMs) || createdMs < cutoffMs) return false;
    }
    return true;
  });
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
