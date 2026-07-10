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

export function aggregatePaidAmountTotals(
  rows: readonly { readonly paidAmounts?: readonly ReportPaidAmount[] | null }[]
): ReportPaidAmount[] {
  const byCurrency = new Map<
    CurrencyCode,
    {
      amount: number;
      displayAmount?: { amount: number; currency: CurrencyCode };
    }
  >();

  for (const row of rows) {
    for (const paid of row.paidAmounts ?? []) {
      const numericAmount = Number.parseFloat(paid.amount);
      if (!Number.isFinite(numericAmount)) {
        continue;
      }

      const existing = byCurrency.get(paid.currency) ?? { amount: 0 };
      existing.amount += numericAmount;

      if (paid.displayAmount?.amount && paid.displayAmount.currency && !paid.displayAmount.stale) {
        const displayNumeric = Number.parseFloat(paid.displayAmount.amount);
        if (!Number.isFinite(displayNumeric)) {
          existing.displayAmount = undefined;
        } else if (!existing.displayAmount) {
          existing.displayAmount = {
            amount: displayNumeric,
            currency: paid.displayAmount.currency,
          };
        } else if (existing.displayAmount.currency === paid.displayAmount.currency) {
          existing.displayAmount.amount += displayNumeric;
        } else {
          existing.displayAmount = undefined;
        }
      } else {
        existing.displayAmount = undefined;
      }

      byCurrency.set(paid.currency, existing);
    }
  }

  return [...byCurrency.entries()].map(([currency, data]) => ({
    id: `total-${currency}`,
    amount: data.amount.toFixed(2),
    currency,
    displayAmount: data.displayAmount
      ? {
          id: `display-total-${currency}`,
          amount: data.displayAmount.amount.toFixed(2),
          currency: data.displayAmount.currency,
          stale: false,
        }
      : null,
  }));
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

export function aggregateCurrencyTotalsWithDisplay(
  rows: readonly { readonly paidAmounts?: readonly ReportPaidAmount[] | null }[]
): readonly {
  readonly currency: CurrencyCode;
  readonly amount: number;
  readonly percent: number;
  readonly paidAmount: ReportPaidAmount;
}[] {
  const paidTotals = aggregatePaidAmountTotals(rows);
  const totalLocked = paidTotals.reduce((sum, paid) => {
    const numeric = Number.parseFloat(paid.amount);
    return Number.isFinite(numeric) ? sum + numeric : sum;
  }, 0);

  return paidTotals.map(paid => {
    const amount = Number.parseFloat(paid.amount);
    const lockedAmount = Number.isFinite(amount) ? amount : 0;

    return {
      currency: paid.currency,
      amount: lockedAmount,
      percent: totalLocked > 0 ? Math.round((lockedAmount / totalLocked) * 100) : 0,
      paidAmount: paid,
    };
  });
}
