import { type CurrencyOption, getCurrencyDisplayName } from "@/frontend/common/lib/currency";

// NEW FOR PLAN v5: consolidated byte-identical tier twin (mobile/desktop) currencyOptionRow.utils.ts into a single common source.
export function getCurrencyOptionRowLabel(currency: CurrencyOption, locale: string): string {
  const name = getCurrencyDisplayName(currency.code, locale);
  return `${name} (${currency.code as string})`;
}
