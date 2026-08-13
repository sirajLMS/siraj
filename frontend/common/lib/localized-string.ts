import { ALLOWED_LOCALES } from "@/frontend/common/types/localized-string.types";
import type { AppLocale } from "@/shared/i18n/routing";
import {
  localeJsonKey,
  omitEmptyLocalizedString,
  resolveLocalizedString,
  setLocalizedString,
} from "@/shared/lib/localized-string";
import {
  DEFAULT_CONTENT_LOCALE,
  isAppLocale,
  type LocalizedString,
  normalizeContentLocale,
} from "@/shared/types/localized-string";

export {
  ALLOWED_LOCALES,
  DEFAULT_CONTENT_LOCALE,
  isAppLocale,
  localeJsonKey,
  normalizeContentLocale,
  omitEmptyLocalizedString,
  resolveLocalizedString,
  setLocalizedString,
};

/** Remove a locale entry from the map (returns a new object). */
export function removeLocalizedString(map: LocalizedString | null | undefined, locale: AppLocale): LocalizedString {
  if (!map) {
    return {};
  }
  const next: Record<string, string> = { ...map };
  delete next[locale];
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
