// NEW FOR PLAN v5: lifted to common to unify tier (mobile/desktop) CurrencyOptionRow duplicated type declarations.
import type { CurrencyOption } from "@/frontend/common/lib/currency";

export type CurrencyOptionRowProps = {
  readonly currency: CurrencyOption;
  readonly locale: string;
  readonly showSymbol?: boolean;
};
