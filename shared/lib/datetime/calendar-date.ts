/** Strict `YYYY-MM-DD` check that also rejects impossible calendar days (JS `Date` rolls them over). */
export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const constructed = new Date(Date.UTC(year, month - 1, day));
  return (
    constructed.getUTCFullYear() === year && constructed.getUTCMonth() === month - 1 && constructed.getUTCDate() === day
  );
}
