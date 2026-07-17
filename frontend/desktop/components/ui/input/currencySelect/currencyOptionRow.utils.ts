import { type CurrencyOption, getCurrencyDisplayName } from "@/frontend/common/lib/currency";

/**
 * Desktop-tier duplicate of `@/frontend/common/components/ui/input/currencySelect/currencyOptionRow.utils`.
 */
export function getCurrencyOptionRowLabelDesktop(currency: CurrencyOption, locale: string): string {
  const name = getCurrencyDisplayName(currency.code, locale);
  return `${name} (${currency.code as string})`;
}
