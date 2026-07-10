import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import type { FxDisplayMessages } from "@/frontend/lib/buildFxDisplayMessages";
import { formatLockedAmount, getCurrencyDecimals } from "@/frontend/lib/currency";

export type DisplayAmountLike = {
  readonly amount?: string | null;
  readonly currency: CurrencyCode | null;
  readonly stale: boolean | null;
};

export { formatLockedAmount, getCurrencyDecimals };

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

  if (!displayAmount) {
    return messages.displayCurrencyNotSet({
      lockedAmount: lockedFormatted,
      lockedCurrency: lockedCurrencyLabel,
    });
  }

  if (displayAmount.stale || !displayAmount.amount || !displayAmount.currency) {
    return messages.displayCurrencyStale({
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
