import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";

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
    .filter((row): row is NonNullable<typeof row> & { currency: CurrencyCode } => row?.currency != null)
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

export interface BillingCurrencyTotalsDisplay {
  readonly primary: string;
  readonly breakdown?: string;
}

function formatSingleBucketForMetric(
  bucket: BillingCurrencyBucket,
  locale: string,
  messages: FxDisplayMessages
): BillingCurrencyTotalsDisplay {
  const lockedFormatted = formatLockedAmount(bucket.amount, bucket.currency, locale);
  const displayAmount = bucket.displayAmount;

  if (!displayAmount?.amount || !displayAmount.currency || displayAmount.stale) {
    return {
      primary: lockedFormatted,
      breakdown: formatCurrencyForDisplay(
        bucket.amount,
        bucket.currency,
        displayAmount
          ? {
              amount: displayAmount.amount,
              currency: displayAmount.currency ?? bucket.currency,
              stale: displayAmount.stale ?? true,
            }
          : null,
        locale,
        messages
      ),
    };
  }

  if (bucket.currency === displayAmount.currency) {
    return { primary: lockedFormatted };
  }

  const convertedFormatted = formatLockedAmount(displayAmount.amount, displayAmount.currency, locale);
  return {
    primary: convertedFormatted,
    breakdown: formatCurrencyForDisplay(
      bucket.amount,
      bucket.currency,
      {
        amount: displayAmount.amount,
        currency: displayAmount.currency,
        stale: displayAmount.stale ?? false,
      },
      locale,
      messages
    ),
  };
}

export function formatBillingCurrencyTotals(
  buckets: readonly BillingCurrencyBucket[],
  locale: string,
  messages: FxDisplayMessages
): BillingCurrencyTotalsDisplay {
  if (buckets.length === 0) {
    return { primary: "—" };
  }

  if (buckets.length === 1) {
    return formatSingleBucketForMetric(buckets[0], locale, messages);
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

    // All buckets have displayAmount but currencies differ
    const lockedPrimary = formattedBuckets.join(" · ");
    const mixedMessage = messages.displayCurrencyMixed({ lockedAmount: lockedPrimary, lockedCurrency: "" });
    return { primary: mixedMessage, breakdown: formattedBuckets.join(" · ") };
  }

  // Some buckets have no displayAmount or are stale
  if (convertibleBuckets.length > 0 && convertibleBuckets.length < buckets.length) {
    const lockedPrimary = formattedBuckets.join(" · ");
    const mixedMessage = messages.displayCurrencyMixed({ lockedAmount: lockedPrimary, lockedCurrency: "" });
    return { primary: mixedMessage, breakdown: formattedBuckets.join(" · ") };
  }

  return { primary: formattedBuckets.join(" · ") };
}
