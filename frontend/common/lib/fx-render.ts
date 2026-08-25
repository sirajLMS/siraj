import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { formatLockedAmount } from "@/frontend/common/lib/currency";

export type DisplayAmountLike = {
  readonly amount?: string | null;
  readonly currency: CurrencyCode | null;
  readonly stale: boolean | null;
};

export type FormatCurrencyMessages = Pick<
  FxDisplayMessages,
  "convertedAmount" | "displayCurrencyNotSet" | "displayCurrencyStale"
>;

export function formatCurrencyForDisplay(
  lockedAmount: string,
  lockedCurrency: CurrencyCode,
  displayAmount: DisplayAmountLike | null | undefined,
  locale: string,
  messages: FormatCurrencyMessages
): string {
  const lockedFormatted = formatLockedAmount(lockedAmount, lockedCurrency, locale);
  const lockedCurrencyLabel = lockedCurrency;

  // When display currency is not set OR stale, return the locked amount directly
  // instead of a long error sentence. The prior behavior returned
  // "Display currency not set. Amount locked: $100 USD" which was truncated by
  // the table column to "Display currency not set. Amou..." — unreadable.
  // Returning just the locked amount keeps the column compact + readable; the
  // "not set" / "stale" context is conveyed by the `displayAmountStale` flag
  // on the row (consumers can show a tooltip or icon for the full message).
  if (!displayAmount) {
    return lockedFormatted;
  }

  if (displayAmount.stale || !displayAmount.amount || !displayAmount.currency) {
    return lockedFormatted;
  }

  if (lockedCurrency === displayAmount.currency) {
    return lockedFormatted;
  }

  const convertedApprox = formatLockedAmount(displayAmount.amount, displayAmount.currency, locale);
  return messages.convertedAmount({
    lockedAmount: lockedFormatted,
    lockedCurrency: lockedCurrencyLabel,
    convertedApprox,
    displayCurrency: displayAmount.currency,
  });
}
