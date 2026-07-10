import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { CurrencyCode as CurrencyCodeEnum } from "@/frontend/graphql/generated/gql/graphql-types";
import { formatLockedAmount } from "@/frontend/lib/currency";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";

export interface BillingCurrencyBucket {
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly displayAmount?: {
    readonly amount?: string | null;
    readonly currency?: CurrencyCode | null;
    readonly stale?: boolean | null;
  } | null;
}

type GqlCurrencyBucket = {
  readonly currency?: CurrencyCode | null;
  readonly amount?: string | null;
  readonly displayAmount?: {
    readonly amount?: string | null;
    readonly currency?: CurrencyCode | null;
    readonly stale?: boolean | null;
  } | null;
} | null;

export function mapBillingCurrencyBuckets(
  rows: readonly GqlCurrencyBucket[] | null | undefined
): BillingCurrencyBucket[] {
  return (rows ?? [])
    .filter((row): row is NonNullable<typeof row> & { currency: CurrencyCode } => row != null && row.currency != null)
    .map(row => ({
      amount: row.amount ?? "0.00",
      currency: row.currency,
      displayAmount: row.displayAmount
        ? {
            amount: row.displayAmount.amount,
            currency: row.displayAmount.currency,
            stale: row.displayAmount.stale,
          }
        : null,
    }));
}

type FormatCurrencyMessages = {
  readonly convertedAmount: (values: {
    lockedAmount: string;
    lockedCurrency: string;
    convertedApprox: string;
    displayCurrency: string;
  }) => string;
  readonly convertedTotalApprox: (values: { convertedApprox: string; displayCurrency: string }) => string;
  readonly displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) => string;
};

export interface BillingCurrencyTotalsDisplay {
  readonly primary: string;
  readonly breakdown?: string;
}

export function formatBillingCurrencyTotals(
  buckets: readonly BillingCurrencyBucket[],
  locale: string,
  messages: FormatCurrencyMessages
): BillingCurrencyTotalsDisplay {
  if (buckets.length === 0) {
    return { primary: formatLockedAmount("0.00", CurrencyCodeEnum.Usd, locale) };
  }

  const formattedBuckets = buckets.map(bucket =>
    formatCurrencyForDisplay(
      bucket.amount,
      bucket.currency,
      bucket.displayAmount
        ? {
            amount: bucket.displayAmount.amount,
            currency: bucket.displayAmount.currency ?? bucket.currency,
            stale: bucket.displayAmount.stale ?? true,
          }
        : null,
      locale,
      messages
    )
  );

  const convertibleBuckets = buckets.filter(
    bucket => bucket.displayAmount?.amount && bucket.displayAmount.currency && !bucket.displayAmount.stale
  );

  if (convertibleBuckets.length === buckets.length && convertibleBuckets.length > 0) {
    const displayCurrency = convertibleBuckets[0]?.displayAmount?.currency;
    const allSameDisplayCurrency = convertibleBuckets.every(
      bucket => bucket.displayAmount?.currency === displayCurrency
    );

    if (displayCurrency && allSameDisplayCurrency) {
      const convertedTotal = convertibleBuckets.reduce((sum, bucket) => {
        const numeric = Number.parseFloat(bucket.displayAmount?.amount ?? "0");
        return Number.isFinite(numeric) ? sum + numeric : sum;
      }, 0);

      const convertedApprox = convertedTotal.toFixed(2);
      const primary = messages.convertedTotalApprox({ convertedApprox, displayCurrency });
      const breakdown = formattedBuckets.join(" · ");

      if (buckets.length === 1) {
        return { primary: formattedBuckets[0] ?? primary };
      }

      return { primary, breakdown };
    }
  }

  return { primary: formattedBuckets.join(" · ") };
}
