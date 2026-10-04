import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  type BillingCurrencyBucket,
  formatBillingCurrencyTotals,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import type { ReportLedgerRow } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import { aggregatePaidAmountTotals } from "@/frontend/common/views/dashboard/reports/utils/formatReportPaidAmounts";

/** Precomputed paid-amounts totals display handed down to the tier views. */
export interface ReportsTotalsDisplay {
  readonly primary: string;
  readonly breakdown?: string;
  readonly ariaLabel?: string;
}

/**
 * Aggregates the ledger rows' paid amounts into a single localized totals
 * display. Rows without paid amounts render the "not set" placeholder.
 */
export function computeReportsTotalsDisplay(
  rows: readonly ReportLedgerRow[],
  locale: string,
  notSetLabel: string,
  fxMessages: FxDisplayMessages
): ReportsTotalsDisplay {
  const paidTotals = aggregatePaidAmountTotals(rows);
  if (paidTotals.length === 0) {
    return { primary: "—", ariaLabel: notSetLabel };
  }

  const buckets: BillingCurrencyBucket[] = paidTotals.map(paid => ({
    amount: paid.amount,
    currency: paid.currency,
    displayAmount: paid.displayAmount
      ? {
          amount: paid.displayAmount.amount,
          currency: paid.displayAmount.currency,
          stale: paid.displayAmount.stale,
        }
      : null,
  }));

  return formatBillingCurrencyTotals(buckets, locale, fxMessages);
}
