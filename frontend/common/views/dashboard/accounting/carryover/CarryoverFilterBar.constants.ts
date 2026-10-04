import type { CarryoverPaidStatusFilter } from "@/frontend/common/stores/carryoverFilterStore";

/** Delay before settled search text is pushed into the carryover filter store. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Search length accepted by both the carryover query and the CSV export route. */
export const SEARCH_INPUT_MAX_LENGTH = 200;

/** Paid-status radio choices, All-first, laid out reading-start to reading-end (mirrors under dir=rtl). */
export const PAID_STATUS_FILTERS: readonly CarryoverPaidStatusFilter[] = ["Both", "Unpaid", "Paid"];

export function isPaidStatusFilter(value: string): value is CarryoverPaidStatusFilter {
  return PAID_STATUS_FILTERS.some(option => option === value);
}
