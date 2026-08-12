/** Years available in the monthly reports year-select dropdown — current year and the 4 preceding years. */
export const YEARS: readonly number[] = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
