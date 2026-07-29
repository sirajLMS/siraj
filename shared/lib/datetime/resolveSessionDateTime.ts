/**
 * Normalizes student-history session `time` values into ISO datetimes.
 * The API historically returned `HH:mm`; newer responses may already be ISO.
 */
export function resolveSessionDateTime(
  time: string,
  year: number,
  month: number,
  dayOfMonth: number
): string {
  const trimmed = time.trim();
  if (!trimmed) {
    return time;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match || dayOfMonth < 1) {
    return time;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  return new Date(Date.UTC(year, month - 1, dayOfMonth, hours, minutes)).toISOString();
}
