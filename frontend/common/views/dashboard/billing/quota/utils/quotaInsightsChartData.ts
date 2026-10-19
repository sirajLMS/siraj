import type { QuotaItem } from "@/frontend/common/views/dashboard/billing/quota/types/quota.types";

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
    const existing = monthMap.get(key) ?? { ...init };
    accum(existing, q);
    monthMap.set(key, existing);
  }
  return Array.from(monthMap.entries()).toSorted((a, b) => a[0].localeCompare(b[0]));
}
