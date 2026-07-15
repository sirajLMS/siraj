import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";

/**
 * Canonical definition of the `LocalizedString` JSONB map type and helpers.
 *
 * Lives in `shared/` so frontend (`@/frontend/...`), backend
 * (`@/backend/...`), and `app/` server entry points can all import it
 * without violating layer isolation. The backend copy at
 * `@/backend/types/shared/localized-string.types` re-exports these symbols
 * for backwards compatibility with existing backend consumers.
 *
 * Importing `locales` directly from `@/shared/locale/AppLocale` (a pure
 * `.ts` file with no React/Next deps) instead of from `@/shared/i18n/routing`
 * (a `"use client"` module that imports `next/navigation`) avoids a server
 * bundle circular-init issue where `locales` could be `undefined`, which
 * made `KNOWN_LOCALES.includes(...)` throw at runtime.
 */

/** Partial map keyed by AppLocale; default locale should be present for system seeds. */
export type LocalizedString = Partial<Record<AppLocale, string>>;

export const DEFAULT_CONTENT_LOCALE: AppLocale = defaultLocale;

const KNOWN_LOCALES: readonly string[] = locales;

export function isAppLocale(value: string): value is AppLocale {
  return KNOWN_LOCALES.includes(value);
}

export function normalizeContentLocale(locale?: string): AppLocale {
  if (locale && isAppLocale(locale)) {
    return locale;
  }
  return DEFAULT_CONTENT_LOCALE;
}
