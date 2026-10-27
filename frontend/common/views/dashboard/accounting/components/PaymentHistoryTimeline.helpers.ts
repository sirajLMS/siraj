export type HistoryEvent = {
  readonly id: string | null;
  readonly kind: string | null;
  readonly occurredAt: string | Date | null;
  readonly hoursDelta: string | null;
  readonly notes: string | null;
};

/** Epoch milliseconds; unparseable or missing dates sort as 0 (oldest). */
export const toMillis = (value: string | Date | null): number => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/** Events sorted newest-first, with timestamps parsed once before sorting. */
export function sortHistoryEvents<T extends HistoryEvent>(events: readonly T[]): T[] {
  const mapped = events.map(event => ({ event, timeMs: toMillis(event.occurredAt) }));
  mapped.sort((a, b) => b.timeMs - a.timeMs);
  return mapped.map(m => m.event);
}
