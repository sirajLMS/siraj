import { type CurrencyOption, getCurrencyDisplayName } from "@/frontend/common/lib/currency";

/**
 * Desktop-tier duplicate of this desktop file.
 */
export function getCurrencyOptionRowLabelDesktop(currency: CurrencyOption, locale: string): string {
  const name = getCurrencyDisplayName(currency.code, locale);
  return `${name} (${currency.code as string})`;
}
