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

  if (!displayAmount) {
    return messages.displayCurrencyNotSet({ lockedAmount: lockedFormatted, lockedCurrency: lockedCurrencyLabel });
  }

  if (displayAmount.stale || !displayAmount.amount || !displayAmount.currency) {
    return messages.displayCurrencyStale({ lockedAmount: lockedFormatted, lockedCurrency: lockedCurrencyLabel });
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
