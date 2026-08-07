import { ALLOWED_LOCALES } from "@/frontend/common/types/localized-string.types";
import type { AppLocale } from "@/shared/i18n/routing";
import type { LocalizedString } from "@/shared/types/localized-string";
import { DEFAULT_CONTENT_LOCALE, isAppLocale, normalizeContentLocale } from "@/shared/types/localized-string";

export { ALLOWED_LOCALES, DEFAULT_CONTENT_LOCALE, isAppLocale, normalizeContentLocale };

/**
 * Resolve a `LocalizedString` map to a single display string.
 * Mirrors backend `resolveLocalized` fallback chain:
 * request → default `ar` → first available value → "".
 */
export function resolveLocalizedString(map: LocalizedString | null | undefined, locale?: string): string {
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
    if (value !== "") {
      return value;
    }
  }
  return "";
}

/** Set one locale's value in the map (returns a new object). */
export function setLocalizedString(
  map: LocalizedString | null | undefined,
  locale: AppLocale,
  text: string
): LocalizedString {
  if (!map) {
    return { [locale]: text };
  }
  return { ...map, [locale]: text };
}

/** Remove a locale entry from the map (returns a new object). */
export function removeLocalizedString(map: LocalizedString | null | undefined, locale: AppLocale): LocalizedString {
  if (!map) {
    return {};
  }
  const next: Record<string, string> = { ...map };
  delete next[locale];
  return next;
}

/** Drop entries whose value is empty/whitespace. */
export function omitEmptyLocalizedString(map: LocalizedString | null | undefined): LocalizedString {
  if (!map) {
    return {};
  }
  const next: LocalizedString = {};
  for (const [locale, value] of Object.entries(map)) {
    if (typeof value === "string" && value.trim() !== "") {
      next[locale as AppLocale] = value;
    }
  }
  return next;
}

/**
 * Returns `true` when every required locale has a non-empty value AND, when
 * `required` is true, at least one entry is non-empty.
 */
export function hasRequiredLocalizedValue(
  map: LocalizedString | null | undefined,
  requiredLocales: readonly AppLocale[]
): boolean {
  const cleaned = omitEmptyLocalizedString(map);
  const hasAny = Object.keys(cleaned).length > 0;
  if (requiredLocales.length === 0) {
    return true;
  }
  if (!hasAny && requiredLocales.length > 0) {
    return false;
  }
  return requiredLocales.every(locale => typeof cleaned[locale] === "string");
}

/** Pick the locale to start editing on: the UI display locale if allowed, else the default content locale. */
export function pickInitialActiveLocale(uiLocale?: string): AppLocale {
  if (uiLocale && isAppLocale(uiLocale)) {
    return uiLocale;
  }
  return DEFAULT_CONTENT_LOCALE;
}

/** Locales from `ALLOWED_LOCALES` not yet present (or empty) in the map. */
export function unusedLocales(map: LocalizedString | null | undefined): readonly AppLocale[] {
  const cleaned = omitEmptyLocalizedString(map);
  return ALLOWED_LOCALES.filter(locale => typeof cleaned[locale] !== "string");
}
