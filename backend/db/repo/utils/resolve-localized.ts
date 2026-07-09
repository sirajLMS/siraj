import type { LocalizedString } from "@/backend/types/localized-string.types";
import { DEFAULT_CONTENT_LOCALE, isAppLocale, normalizeContentLocale } from "@/backend/types/localized-string.types";

/**
 * Resolve a localized JSONB map to a single string for the request locale.
 * Fallback: request locale → default locale (ar) → first available value → "".
 */
export function resolveLocalized(map: LocalizedString | null | undefined, locale?: string): string {
  if (!map) {
    return "";
  }

  const requested = normalizeContentLocale(locale);
  const requestedValue = map[requested];
  if (requestedValue !== undefined && requestedValue !== "") {
    return requestedValue;
  }

  const defaultValue = map[DEFAULT_CONTENT_LOCALE];
  if (defaultValue !== undefined && defaultValue !== "") {
    return defaultValue;
  }

  for (const value of Object.values(map)) {
    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return "";
}

/**
 * Merge a single-locale value into an existing localized map.
 */
export function setLocalized(
  existing: LocalizedString | null | undefined,
  locale: string,
  value: string
): LocalizedString {
  const key = normalizeContentLocale(locale);
  return {
    ...(existing ?? {}),
    [key]: value,
  };
}

/**
 * Build a SQL-safe locale key for jsonb `->>` extraction (known locales only).
 */
export function localeJsonKey(locale?: string): string {
  return normalizeContentLocale(locale);
}

export { DEFAULT_CONTENT_LOCALE, isAppLocale, normalizeContentLocale };
