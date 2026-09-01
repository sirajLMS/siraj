export const FX_SUBJECT_CURRENCY_CHANGED_KEY = "fxSubjectCurrencyChanged";

/**
 * Broadcast a subject display-currency change to other tabs via localStorage.
 * The `storage` event fires only in *other* windows of the same origin,
 * so callers should also refetch queries in the current tab if needed.
 */
export function broadcastSubjectCurrencyChanged(userId: string): void {
  try {
    localStorage.setItem(FX_SUBJECT_CURRENCY_CHANGED_KEY, JSON.stringify({ userId, ts: Date.now() }));
  } catch {
    // localStorage may be unavailable in private browsing
  }
}
