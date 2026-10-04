import type { FxWarning } from "@/backend/types";

/** Wire + display format of the accounting-month filter (year-month only). */
export const MONTH_FORMAT = "yyyy-MM";

/** URL search-parameter names the filter bar keeps in sync. */
export const MONTH_PARAM = "month";
export const CURRENCY_PARAM = "currency";

/** Stable empty default for the optional FX-warning list prop. */
export const EMPTY_FX_WARNINGS: readonly FxWarning[] = [];
