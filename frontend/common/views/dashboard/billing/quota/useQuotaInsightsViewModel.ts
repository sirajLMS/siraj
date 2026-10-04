"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import type { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { logger } from "@/frontend/common/utils/logger";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import {
  applyInsightsFilters,
  buildChartData,
  type InsightsDateRange,
  type QuotaInsightsChartData,
  type QuotaInsightsFilters,
  type QuotaInsightsMetricsData,
} from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel.helpers";
import {
  buildQuotaInsightsCsv,
  computeInsightsMetrics,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaInsights.helpers";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { useAppLocale } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardBillingQuota } from "@/shared/locale/namespaces";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

/** Cache options object for Intl.DateTimeFormat to utilize getDateTimeFormatter WeakMap cache. */
const MONTH_SHORT_OPTIONS: Intl.DateTimeFormatOptions = { month: "short" };

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

  // Use getDateTimeFormatter to reuse cached Intl.DateTimeFormat instances and eliminate instantiation overhead
  const monthFormatter = useMemo(() => getDateTimeFormatter(getLatnLocaleTag(locale), MONTH_SHORT_OPTIONS), [locale]);

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
