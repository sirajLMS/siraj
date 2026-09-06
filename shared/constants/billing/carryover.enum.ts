/**
 * Closed set of carryover paid-status filter values shared by the GraphQL
 * filter narrowing, the CSV export route, and the carryover list UI. `"Both"`
 * and a missing filter both mean "all rows".
 */
export const CARRYOVER_PAID_STATUS_VALUES = ["Paid", "Unpaid", "Both"] as const;

/** One carryover paid-status filter value. */
export type CarryoverPaidStatus = (typeof CARRYOVER_PAID_STATUS_VALUES)[number];
