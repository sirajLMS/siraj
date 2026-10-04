import { isValid, parse } from "date-fns";
import type { FxWarning } from "@/backend/types";
import { MONTH_FORMAT } from "@/frontend/common/views/dashboard/accounting/profit-loss/GlobalFilterBar.constants";

/** Parses the stored YYYY-MM month into a calendar date for the month picker. */
export function parseMonth(month: string): Date | null {
  const parsed = parse(month, MONTH_FORMAT, new Date());
  if (!isValid(parsed)) return null;
  return parsed;
}

export function isMonthParam(value: string | null): value is string {
  return value !== null && isValid(parse(value, MONTH_FORMAT, new Date()));
}

/** One "ORIGINAL → TARGET (N rows)" tooltip entry per FX warning. */
function formatFxPair(warning: Readonly<FxWarning>): string {
  return `${warning.originalCurrency} → ${warning.targetCurrency} (${warning.rowCount})`;
}

export function joinFxPairs(warnings: readonly FxWarning[]): string {
  return warnings.map(formatFxPair).join(" · ");
}
