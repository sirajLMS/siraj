import { type CurrencyOption, getCurrencyDisplayName } from "@/frontend/common/lib/currency";

export function getCurrencyOptionRowLabel(currency: CurrencyOption, locale: string): string {
  const name = getCurrencyDisplayName(currency.code, locale);
  return `${name} (${currency.code as string})`;
}
