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

function filterByDateRange(quotas: QuotaItem[], dateRange: InsightsDateRange): QuotaItem[] {
  if (dateRange === "all") return quotas;
  const now = new Date();
  const cutoff = new Date(now);
  switch (dateRange) {
    case "month":
      cutoff.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      cutoff.setMonth(now.getMonth() - 3);
      break;
    case "year":
      cutoff.setFullYear(now.getFullYear() - 1);
      break;
  }
  return quotas.filter(q => {
    const d = q.createdAt ? new Date(q.createdAt) : null;
    return d !== null && d >= cutoff;
  });
}

function filterByKind(quotas: QuotaItem[], kind: QuotaKind | null): QuotaItem[] {
  if (!kind) return quotas;
  return quotas.filter(q => q.kind === kind);
}

function filterByStatus(quotas: QuotaItem[], status: QuotaStatus | null): QuotaItem[] {
  if (!status) return quotas;
  return quotas.filter(q => q.status === status);
}

function filterByStudentId(quotas: QuotaItem[], studentId: string | null): QuotaItem[] {
  if (!studentId) return quotas;
  return quotas.filter(q => q.studentId === studentId);
}

export function applyInsightsFilters(quotas: QuotaItem[], filters: QuotaInsightsFilters): QuotaItem[] {
  return filterByStudentId(
    filterByStatus(filterByKind(filterByDateRange(quotas, filters.dateRange), filters.kind), filters.status),
    filters.studentId
  );
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
