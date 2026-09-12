/**
 * Zero-pads a number to two digits using integer comparison
 * instead of String.padStart().
 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Zero-pads a number to three digits using integer comparisons
 * instead of String.padStart().
 */
function pad3(n: number): string {
  if (n < 10) return `00${n}`;
  if (n < 100) return `0${n}`;
  return `${n}`;
}

/**
 * Formats a date as YYYY-MM-DD HH:mm:ss.SSS
 * Shared between frontend and backend.
 *
 * Pads components via integer comparison instead of String.padStart() to avoid
 * intermediate String allocations in this hot path (logger timestamp formatting).
 */
export function formatTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  const milliseconds = pad3(date.getMilliseconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}
