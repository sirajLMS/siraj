import { DEFAULT_CONTENT_LOCALE, type LocalizedString, normalizeContentLocale } from "@/shared/types";

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

/**
 * Drop entries whose value is empty/whitespace.
 * Mirrors `frontend/lib/localized-string.ts → omitEmptyLocalizedString`.
 */
export function omitEmptyLocalized(map: LocalizedString | null | undefined): LocalizedString {
  if (!map) {
    return {};
  }
  const next: Record<string, string> = {};
  for (const [locale, value] of Object.entries(map)) {
    if (typeof value === "string" && value.trim() !== "") {
      next[locale] = value;
    }
  }
  return next as unknown as LocalizedString;
}
