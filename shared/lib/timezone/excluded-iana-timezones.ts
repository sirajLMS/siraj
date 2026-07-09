/** IANA timezone IDs excluded from generated enums, pickers, and validation lists. */
export const EXCLUDED_IANA_TIMEZONE_IDS = ["Asia/Jerusalem"] as const;

export type ExcludedIanaTimezoneId = (typeof EXCLUDED_IANA_TIMEZONE_IDS)[number];

/** Map excluded legacy/OS timezone IDs to their Palestine equivalent. */
export const EXCLUDED_IANA_TIMEZONE_REPLACEMENTS: Readonly<Record<ExcludedIanaTimezoneId, string>> = {
  "Asia/Jerusalem": "Asia/Hebron",
};

export function isExcludedIanaTimezoneId(timezoneId: string): boolean {
  return (EXCLUDED_IANA_TIMEZONE_IDS as readonly string[]).includes(timezoneId);
}

/** Resolve excluded legacy IDs (e.g. OS-reported Jerusalem) to Palestine timezones. */
export function resolveExcludedIanaTimezoneId(timezoneId: string): string {
  if (isExcludedIanaTimezoneId(timezoneId)) {
    return EXCLUDED_IANA_TIMEZONE_REPLACEMENTS[timezoneId as ExcludedIanaTimezoneId];
  }
  return timezoneId;
}
