"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import type { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { logger } from "@/frontend/common/utils/logger";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import {
  buildDeliveryRate,
  buildExpiredSlippage,
  buildPurchasesOverTime,
  buildQuotaInsightsCsv,
  buildRedemptionByType,
  computeInsightsMetrics,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaInsights.helpers";
import { useAppLocale } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";
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

export interface QuotaInsightsViewModel {
  readonly labels: QuotaLabels;
  readonly loading: boolean;
  readonly error: boolean;
  readonly quotas: QuotaItem[];
  readonly metrics: QuotaInsightsMetricsData;
  readonly chartData: QuotaInsightsChartData;
  readonly filters: QuotaInsightsFilters;
  readonly setDateRange: (range: InsightsDateRange) => void;
  readonly setKind: (kind: QuotaKind | null) => void;
  readonly setStatus: (status: QuotaStatus | null) => void;
  readonly setStudentId: (studentId: string | null) => void;
  readonly exportCsv: () => void;
  readonly refetch: () => void;
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

function applyInsightsFilters(quotas: QuotaItem[], filters: QuotaInsightsFilters): QuotaItem[] {
  return filterByStudentId(
    filterByStatus(filterByKind(filterByDateRange(quotas, filters.dateRange), filters.kind), filters.status),
    filters.studentId
  );
}

function buildChartData(quotas: QuotaItem[], monthFormatter: Intl.DateTimeFormat, labels: QuotaLabels) {
  return {
    purchasesOverTime: buildPurchasesOverTime(quotas, monthFormatter),
    redemptionByType: buildRedemptionByType(quotas, labels),
    deliveryRate: buildDeliveryRate(quotas, labels),
    expiredSlippage: buildExpiredSlippage(quotas, monthFormatter),
  };
}

export function useQuotaInsightsViewModel(): QuotaInsightsViewModel {
  const t = useAppTranslation(DashboardBillingQuota);
  const locale = useAppLocale();

  const [dateRange, setDateRange] = useState<InsightsDateRange>("all");
  const [kind, setKind] = useState<QuotaKind | null>(null);
  const [status, setStatus] = useState<QuotaStatus | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(quotasQueryDocument, {
    variables: {
      filter: null,
      pagination: null,
    },
    fetchPolicy: "cache-and-network",
  });

  const allQuotas: QuotaItem[] = useMemo(() => data?.quotas?.rows ?? [], [data]);

  const filteredQuotas = useMemo(
    () => applyInsightsFilters(allQuotas, { dateRange, kind, status, studentId }),
    [allQuotas, dateRange, kind, status, studentId]
  );

  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short" }), [locale]);

  const metrics = useMemo(() => computeInsightsMetrics(filteredQuotas), [filteredQuotas]);

  const chartData = useMemo(
    () => buildChartData(filteredQuotas, monthFormatter, t),
    [filteredQuotas, monthFormatter, t]
  );

  const exportCsv = useCallback(() => {
    try {
      const csv = buildQuotaInsightsCsv(filteredQuotas, t);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "quota-insights.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      logger.error("Failed to export CSV", { error: err });
    }
  }, [filteredQuotas, t]);

  return {
    labels: t,
    loading,
    error: Boolean(error),
    quotas: filteredQuotas,
    metrics: {
      activeQuotasCount: metrics.activeCount,
      totalClassesRemaining: metrics.totalRemaining,
      totalReserved: metrics.totalReserved,
      expiringThisWeekCount: metrics.expiringCount,
      pendingBacklogCount: metrics.pendingBacklogCount,
    },
    chartData,
    filters: { dateRange, kind, status, studentId },
    setDateRange,
    setKind,
    setStatus,
    setStudentId,
    exportCsv,
    refetch: () => void refetch(),
  };
}
