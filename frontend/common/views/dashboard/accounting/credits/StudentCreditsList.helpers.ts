export const SEARCH_DEBOUNCE_MS = 300;
/** Balances at or below this threshold render the balance chip as a warning. */
const LOW_BALANCE_THRESHOLD = 3;

export function buildAdjustHref(studentId: string): string {
  return `/accounting/credits/adjust?studentId=${studentId}`;
}

export function creditBalanceStatus(classesRemaining: number | null): string {
  if (classesRemaining === null) return "UNSET";
  if (classesRemaining <= 0) return "EXHAUSTED";
  if (classesRemaining <= LOW_BALANCE_THRESHOLD) return "LOW";
  return "AVAILABLE";
}
