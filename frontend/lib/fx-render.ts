import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { formatLockedAmount, getCurrencyDecimals } from "@/frontend/lib/currency";

export type DisplayAmountLike = {
  readonly amount?: string | null;
  readonly currency: CurrencyCode | null;
  readonly stale: boolean | null;
};

export { formatLockedAmount, getCurrencyDecimals };

type FormatCurrencyMessages = {
  readonly convertedAmount: (values: {
    lockedAmount: string;
    lockedCurrency: string;
    convertedApprox: string;
    displayCurrency: string;
  }) => string;
  readonly displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) => string;
};

export function formatCurrencyForDisplay(
  lockedAmount: string,
  lockedCurrency: CurrencyCode,
  displayAmount: DisplayAmountLike | null | undefined,
  locale: string,
  messages: FormatCurrencyMessages
): string {
  const lockedFormatted = formatLockedAmount(lockedAmount, lockedCurrency, locale);
  const lockedCurrencyLabel = lockedCurrency;

  if (!displayAmount || displayAmount.stale || !displayAmount.amount || !displayAmount.currency) {
    return messages.displayCurrencyFallback({
      lockedAmount: lockedFormatted,
      lockedCurrency: lockedCurrencyLabel,
    });
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
