/**
 * Accounting-month (YYYY-MM) validation shared by the Profit & Loss report
 * pipeline: the service-layer month validation and the repository-level
 * hostile-input guard both refuse anything that is not a four-digit year and a
 * real calendar month (01–12), so a malformed month can never widen a filter
 * into an unbounded scan.
 */

/** Strict `YYYY-MM` shape with a real calendar month — single source of truth. */
export const PROFIT_LOSS_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
