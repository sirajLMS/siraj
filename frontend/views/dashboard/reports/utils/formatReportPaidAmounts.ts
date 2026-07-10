"use client";

import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import type { ReportPaidAmount } from "@/frontend/views/dashboard/reports/types/reportsTypes";

type FormatCurrencyMessages = {
  readonly convertedAmount: (values: {
    lockedAmount: string;
    lockedCurrency: string;
    convertedApprox: string;
    displayCurrency: string;
  }) => string;
  readonly displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) => string;
};

export function formatReportPaidAmount(
  paid: ReportPaidAmount,
  locale: string,
  messages: FormatCurrencyMessages
): string {
  return formatCurrencyForDisplay(
    paid.amount,
    paid.currency,
    paid.displayAmount
      ? {
          amount: paid.displayAmount.amount,
          currency: paid.displayAmount.currency ?? paid.currency,
          stale: paid.displayAmount.stale ?? true,
        }
      : null,
    locale,
    messages
  );
}

export function formatReportPaidAmounts(
  paidAmounts: readonly ReportPaidAmount[],
  locale: string,
  messages: FormatCurrencyMessages
): string {
  if (paidAmounts.length === 0) {
    return "—";
  }
  return paidAmounts.map(paid => formatReportPaidAmount(paid, locale, messages)).join(" · ");
}

export function aggregateCurrencyTotals(
  rows: readonly { readonly paidAmounts?: readonly ReportPaidAmount[] | null }[]
): readonly { readonly currency: CurrencyCode; readonly amount: number; readonly percent: number }[] {
  const currencyMap = new Map<CurrencyCode, number>();

  for (const row of rows) {
    for (const paid of row.paidAmounts ?? []) {
      const numericAmount = Number.parseFloat(paid.amount);
      if (!Number.isFinite(numericAmount)) {
        continue;
      }
      currencyMap.set(paid.currency, (currencyMap.get(paid.currency) ?? 0) + numericAmount);
    }
  }

  const totalPaid = [...currencyMap.values()].reduce((sum, value) => sum + value, 0);
  return [...currencyMap.entries()].map(([currency, amount]) => ({
    currency,
    amount,
    percent: totalPaid > 0 ? Math.round((amount / totalPaid) * 100) : 0,
  }));
}
