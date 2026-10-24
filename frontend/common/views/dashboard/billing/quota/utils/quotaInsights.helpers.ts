import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import {
  type DeliveryRateData,
  type ExpiredSlippageData,
  groupQuotasByMonth,
  type PurchasesOverTimeData,
  type RedemptionByTypeData,
} from "@/frontend/common/views/dashboard/billing/quota/utils/quotaInsightsChartData";
import type { QuotaInsightsMetrics } from "@/frontend/common/views/dashboard/billing/quota/utils/quotaInsightsMetrics.types";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export function buildPurchasesOverTime(
  quotas: QuotaItem[],
  monthFormatter: Intl.DateTimeFormat
): PurchasesOverTimeData[] {
  const entries = groupQuotasByMonth(
    quotas,
    q => q.createdAt,
    { purchases: 0, classes: 0 },
    (agg, q) => {
      agg.purchases += 1;
      agg.classes += q.totalClasses ?? 0;
    },
    monthFormatter
  );
  return entries.map(([month, data]) => ({ month, purchases: data.purchases, classes: data.classes }));
}

export function buildRedemptionByType(
  quotas: QuotaItem[],
  labels: Pick<QuotaLabels["charts"], "packageType" | "periodicType">
): RedemptionByTypeData[] {
  let pkg = 0;
  let periodic = 0;
  for (const q of quotas) {
    const redeemed = (q.totalClasses ?? 0) - (q.remaining ?? 0);
    if (q.kind === QuotaKind.Package) pkg += redeemed;
    else if (q.kind === QuotaKind.Periodic) periodic += redeemed;
  }
  const total = pkg + periodic;
  if (total === 0) return [];
  return [
    { name: labels.packageType, value: pkg, pct: Math.round((pkg / total) * 100) },
    { name: labels.periodicType, value: periodic, pct: Math.round((periodic / total) * 100) },
  ].filter(d => d.value > 0);
}

export function buildDeliveryRate(
  quotas: QuotaItem[],
  labels: Pick<QuotaLabels["charts"], "committed" | "cancelled">
): DeliveryRateData[] {
  let committed = 0;
  let cancelled = 0;
  for (const q of quotas) {
    if (q.kind !== QuotaKind.Package) continue;
    if (q.status === QuotaStatus.Active) committed += 1;
    else cancelled += 1;
  }
  return [
    { name: labels.committed, count: committed },
    { name: labels.cancelled, count: cancelled },
  ];
}

/**
 * Builds cumulative expired and redeemed slippage data over grouped monthly quota entries.
 *
 * Performance optimization: Pre-allocates result array size to avoid incremental push re-allocations.
 */
export function buildExpiredSlippage(quotas: QuotaItem[], monthFormatter: Intl.DateTimeFormat): ExpiredSlippageData[] {
  const entries = groupQuotasByMonth(
    quotas,
    q => q.validUntil,
    { expired: 0, redeemed: 0 },
    (agg, q) => {
      if (q.status === QuotaStatus.Expired) {
        agg.expired += q.remaining ?? 0;
      }
      if (q.status === QuotaStatus.Active) {
        agg.redeemed += (q.totalClasses ?? 0) - (q.remaining ?? 0);
      }
    },
    monthFormatter
  );
  let cumExp = 0;
  let cumRed = 0;
  const len = entries.length;
  const result: ExpiredSlippageData[] = new Array(len);
  for (let i = 0; i < len; i++) {
    const [monthKey, monthData] = entries[i];
    cumExp += monthData.expired;
    cumRed += monthData.redeemed;
    result[i] = { month: monthKey, cumulativeExpired: cumExp, cumulativeRedeemed: cumRed };
  }
  return result;
}

/**
 * Computes aggregate metrics from quota data.
 *
 * `pendingBacklogCount` counts active quotas with remaining classes that
 * are past their validUntil date (i.e. overdue unredeemed credits) — NOT
 * simply aliased to `activeCount` as in the original implementation.
 */
export function computeInsightsMetrics(quotas: QuotaItem[]): QuotaInsightsMetrics {
  let activeCount = 0;
  let totalRemaining = 0;
  let totalReserved = 0;
  let expiringCount = 0;
  let pendingBacklogCount = 0;

  const nowMs = Date.now();
  const nextWeekMs = nowMs + 7 * 24 * 60 * 60 * 1000;

  for (const q of quotas) {
    const isActive = q.status === QuotaStatus.Active;
    if (isActive) activeCount += 1;

    const remaining = q.remaining ?? 0;
    totalRemaining += remaining;
    totalReserved += q.reservedClasses ?? 0;

    if (!q.validUntil) continue;
    const validUntilMs = Date.parse(q.validUntil);
    if (Number.isNaN(validUntilMs)) continue;
    if (validUntilMs >= nowMs && validUntilMs <= nextWeekMs) expiringCount += 1;
    if (isActive && remaining > 0 && validUntilMs < nowMs) pendingBacklogCount += 1;
  }

  return { activeCount, totalRemaining, totalReserved, expiringCount, pendingBacklogCount };
}

function escapeCsvCell(cell: string): string {
  if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
    return `"${cell.replaceAll('"', '""')}"`;
  }
  return cell;
}

export function buildQuotaInsightsCsv(quotas: QuotaItem[], labels: QuotaLabels): string {
  const headers = [
    labels.fields.name,
    labels.fields.student,
    labels.fields.kind,
    labels.fields.status,
    labels.fields.totalClasses,
    labels.fields.remaining,
    labels.fields.reservedClasses,
    labels.fields.validFrom,
    labels.fields.validUntil,
  ];
  const rows: string[][] = quotas.map(q => [
    q.name ?? "",
    q.studentId ?? "",
    q.kind ?? "",
    q.status ?? "",
    String(q.totalClasses ?? 0),
    String(q.remaining ?? 0),
    String(q.reservedClasses ?? 0),
    q.validFrom ?? "",
    q.validUntil ?? "",
  ]);
  const csvLines = [headers, ...rows].map(row => row.map(escapeCsvCell).join(","));
  return csvLines.join("\n");
}
