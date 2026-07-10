import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { CurrencyCode as CurrencyCodeEnum } from "@/frontend/graphql/generated/gql/graphql-types";
import { formatLockedAmount } from "@/frontend/lib/currency";

export interface CurrencyAmountTotal {
  readonly currency: CurrencyCode;
  readonly amount: string;
}

export function formatMultiCurrencyTotals(
  totals: readonly CurrencyAmountTotal[],
  locale: string,
  emptyCurrency: CurrencyCode = CurrencyCodeEnum.Usd
): string {
  if (totals.length === 0) {
    return formatLockedAmount("0.00", emptyCurrency, locale);
  }

  return totals.map(total => formatLockedAmount(total.amount, total.currency, locale)).join(", ");
}
