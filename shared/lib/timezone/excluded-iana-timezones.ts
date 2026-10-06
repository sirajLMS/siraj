/** IANA timezone IDs excluded from generated enums, pickers, and validation lists. */
const EXCLUDED_IANA_TIMEZONE_IDS = ["Asia/Jerusalem"] as const;

export type ExcludedIanaTimezoneId = (typeof EXCLUDED_IANA_TIMEZONE_IDS)[number];

const EXCLUDED_IANA_TIMEZONE_SET = new Set<string>(EXCLUDED_IANA_TIMEZONE_IDS);

/** Map excluded legacy/OS timezone IDs to their Palestine equivalent. */
const EXCLUDED_IANA_TIMEZONE_REPLACEMENTS: Readonly<Record<ExcludedIanaTimezoneId, string>> = {
  "Asia/Jerusalem": "Asia/Hebron",
};

export function isExcludedIanaTimezoneId(timezoneId: string): timezoneId is ExcludedIanaTimezoneId {
  return EXCLUDED_IANA_TIMEZONE_SET.has(timezoneId);
}

/** Resolve excluded legacy IDs (e.g. OS-reported Jerusalem) to Palestine timezones. */
export function resolveExcludedIanaTimezoneId(timezoneId: string): string {
  if (isExcludedIanaTimezoneId(timezoneId)) {
    return EXCLUDED_IANA_TIMEZONE_REPLACEMENTS[timezoneId];
  }
  return timezoneId;
}
