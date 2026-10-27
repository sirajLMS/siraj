/**
 * Shared helper functions for the OptInTab history section.
 *
 * Extracted from `OptInTab.desktop.tsx` and `OptInTab.mobile.tsx` to eliminate
 * code duplication (Pattern 7 — `__shared__/` directory). Both tier variants
 * use these identical date/CSV utility functions.
 */

import { toCsvCell } from "@/shared/lib/csv/csv-cell";

/** Escapes and quotes a CSV cell value with formula neutralization. */
export function toCsvValue(value: string): string {
  return toCsvCell(value);
}

/** Parses a date string (or null) into a `Date` or null when invalid/empty. */
export function parseDateInput(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Formats a `Date` (or null) as an ISO date string (`YYYY-MM-DD`). */
export function formatDateInput(date: Date | null): string {
  if (!date) {
    return "";
  }
  return date.toISOString().split("T")[0] ?? "";
}
