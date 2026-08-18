import { EventBusyOutlined, Inventory2Outlined, NumbersOutlined } from "@mui/icons-material";
import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";
import type { QuotaInsightsViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaInsightsViewModel";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export interface PurchasesOverTimeData {
  readonly month: string;
  readonly purchases: number;
  readonly classes: number;
}

export interface RedemptionByTypeData {
  readonly name: string;
  readonly value: number;
  readonly pct: number;
}

export interface DeliveryRateData {
  readonly name: string;
  readonly count: number;
}

export interface ExpiredSlippageData {
  readonly month: string;
  readonly cumulativeExpired: number;
  readonly cumulativeRedeemed: number;
}

export function groupQuotasByMonth<T>(
  quotas: QuotaItem[],
  getDate: (q: QuotaItem) => string | null,
  init: T,
  accum: (agg: T, q: QuotaItem) => void,
  monthFormatter: Intl.DateTimeFormat
): [string, T][] {
  const monthMap: Map<string, T> = new Map();
  for (const q of quotas) {
    const dateStr = getDate(q);
    if (!dateStr) continue;
    const d = new Date(dateStr);
    const key = `${monthFormatter.format(d)} ${d.getFullYear()}`;
    const existing = monthMap.get(key) ?? structuredClone(init);
    accum(existing, q);
    monthMap.set(key, existing);
  }
  return Array.from(monthMap.entries()).toSorted((a, b) => a[0].localeCompare(b[0]));
}

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

export function buildRedemptionByType(quotas: QuotaItem[], labels: QuotaLabels): RedemptionByTypeData[] {
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
    { name: labels.charts.packageType, value: pkg, pct: Math.round((pkg / total) * 100) },
    { name: labels.charts.periodicType, value: periodic, pct: Math.round((periodic / total) * 100) },
  ].filter(d => d.value > 0);
}

export function buildDeliveryRate(quotas: QuotaItem[], labels: QuotaLabels): DeliveryRateData[] {
  const pkgQuotas = quotas.filter(q => q.kind === QuotaKind.Package);
  const committed = pkgQuotas.filter(q => q.status === QuotaStatus.Active).length;
  const cancelled = pkgQuotas.filter(q => q.status !== QuotaStatus.Active).length;
  return [
    { name: labels.charts.committed, count: committed },
    { name: labels.charts.cancelled, count: cancelled },
  ];
}

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
  const result: ExpiredSlippageData[] = [];
  for (const [monthKey, monthData] of entries) {
    cumExp += monthData.expired;
    cumRed += monthData.redeemed;
    result.push({ month: monthKey, cumulativeExpired: cumExp, cumulativeRedeemed: cumRed });
  }
  const seen = new Set<string>();
  return result.filter(r => {
    if (seen.has(r.month)) return false;
    seen.add(r.month);
    return true;
  });
}

export interface QuotaInsightsMetrics {
  readonly activeCount: number;
  readonly totalRemaining: number;
  readonly totalReserved: number;
  readonly expiringCount: number;
  readonly pendingBacklogCount: number;
}

/**
 * Computes aggregate metrics from quota data.
 *
 * `pendingBacklogCount` counts active quotas with remaining classes that
 * are past their validUntil date (i.e. overdue unredeemed credits) — NOT
 * simply aliased to `activeCount` as in the original implementation.
 */
export function computeInsightsMetrics(quotas: QuotaItem[]): QuotaInsightsMetrics {
  const activeCount = quotas.filter(q => q.status === QuotaStatus.Active).length;
  const totalRemaining = quotas.reduce((sum, q) => sum + (q.remaining ?? 0), 0);
  const totalReserved = quotas.reduce((sum, q) => sum + (q.reservedClasses ?? 0), 0);
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringCount = quotas.filter(q => {
    if (!q.validUntil) return false;
    const d = new Date(q.validUntil);
    return d >= now && d <= nextWeek;
  }).length;
  const pendingBacklogCount = quotas.filter(q => {
    if (q.status !== QuotaStatus.Active) return false;
    if ((q.remaining ?? 0) <= 0) return false;
    if (!q.validUntil) return false;
    const d = new Date(q.validUntil);
    return d < now;
  }).length;
  return { activeCount, totalRemaining, totalReserved, expiringCount, pendingBacklogCount };
}

function escapeCsvCell(cell: string): string {
  if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
    return `"${cell.replaceAll('"', '""')}"`;
  }
  return cell;
}

export interface CsvRow {
  readonly [key: string]: string;
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

export function buildQuotaInsightsMetrics(vm: Readonly<QuotaInsightsViewModel>): readonly MetricItem[] {
  const { metrics, labels } = vm;
  return [
    {
      key: "activeQuotas",
      count: metrics.activeQuotasCount,
      labelKey: "quota.activeQuotas",
      label: labels.activeQuotasCount(metrics.activeQuotasCount),
      icon: Inventory2Outlined,
      variant: "default",
    },
    {
      key: "totalRemaining",
      count: metrics.totalClassesRemaining,
      labelKey: "quota.remaining",
      label: labels.totalClassesRemaining(metrics.totalClassesRemaining),
      icon: NumbersOutlined,
      variant: "highlight",
    },
    {
      key: "totalReserved",
      count: metrics.totalReserved,
      labelKey: "quota.reserved",
      label: labels.fields.reservedClasses,
      icon: Inventory2Outlined,
      variant: "default",
    },
    {
      key: "pendingBacklog",
      count: metrics.pendingBacklogCount,
      labelKey: "quota.pendingBacklog",
      label: labels.charts.pendingCredits,
      icon: EventBusyOutlined,
      variant: metrics.pendingBacklogCount > 0 ? "danger" : "default",
    },
  ];
}

export function quotaInsightsBreadcrumbs(t: { readonly insights: string; readonly breadcrumbLabel: string }) {
  return [
    { label: t.breadcrumbLabel, href: "/quotas" },
    { label: t.insights, current: true },
  ];
}
