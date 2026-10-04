/** Keystroke-to-query delay for the free-text search box. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Route that streams the filtered carryover list as a CSV download. */
export const CARRYOVER_EXPORT_URL = "/api/carryover/export";

/** Used when the export response carries no Content-Disposition filename. */
export const FALLBACK_EXPORT_FILENAME = "carryover-balances.csv";
