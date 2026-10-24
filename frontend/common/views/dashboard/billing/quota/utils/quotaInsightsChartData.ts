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

/**
 * Groups quota items by formatted month string and aggregates metrics.
 *
 * Performance optimization:
 * - Single-pass indexed loop avoids iterator overhead.
 * - `{ ...init }` and `monthMap.set(key, existing)` executed only on initial insertion (O(M) instead of O(N)).
 * - `Array.from(monthMap.entries()).sort(...)` sorts in-place on newly allocated array, eliminating `.toSorted()` copy allocation.
 */
export function groupQuotasByMonth<T>(
  quotas: QuotaItem[],
  getDate: (q: QuotaItem) => string | null,
  init: T,
  accum: (agg: T, q: QuotaItem) => void,
  monthFormatter: Intl.DateTimeFormat
): [string, T][] {
  const monthMap: Map<string, T> = new Map();
  for (let i = 0; i < quotas.length; i++) {
    const q = quotas[i];
    const dateStr = getDate(q);
    if (!dateStr) continue;
    const d = new Date(dateStr);
    const key = `${monthFormatter.format(d)} ${d.getFullYear()}`;
    let existing = monthMap.get(key);
    if (!existing) {
      existing = { ...init };
      monthMap.set(key, existing);
    }
    accum(existing, q);
  }
  return Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}
