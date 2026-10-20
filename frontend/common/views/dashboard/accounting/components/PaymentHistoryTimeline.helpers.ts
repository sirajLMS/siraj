export type HistoryEvent = {
  readonly id: string | null;
  readonly kind: string | null;
  readonly occurredAt: string | Date | null;
  readonly hoursDelta: string | null;
  readonly notes: string | null;
};

export const toMillis = (value: string | Date | null): number => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return typeof value === "number" ? value : 0;
};

/**
 * Pre-calculates epoch milliseconds in a single pass O(N) mapping
 * and sorts events in descending order (newest first) without creating Date objects during O(N log N) sort.
 */
export function sortHistoryEvents<T extends HistoryEvent>(events: readonly T[]): T[] {
  if (events.length === 0) return [];
  const mapped = events.map(event => ({
    event,
    timeMs: toMillis(event.occurredAt),
  }));
  mapped.sort((a, b) => b.timeMs - a.timeMs);
  return mapped.map(m => m.event);
}
