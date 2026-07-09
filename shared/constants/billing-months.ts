export const BILLING_MONTH_IDS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export type BillingMonthId = (typeof BILLING_MONTH_IDS)[number];
