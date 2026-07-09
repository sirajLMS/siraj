import type { AppLocale } from "@/shared/i18n/routing";
import { locales, routing } from "@/shared/i18n/routing";

/**
 * Canonical definition of the `LocalizedString` JSONB map type and helpers.
 *
 * Lives in `shared/` so frontend (`@/frontend/...`), backend
 * (`@/backend/...`), and `app/` server entry points can all import it
 * without violating layer isolation. The backend copy at
 * `@/backend/types/shared/localized-string.types` re-exports these symbols
 * for backwards compatibility with existing backend consumers.
 */

/** Partial map keyed by AppLocale; default locale should be present for system seeds. */
export type LocalizedString = Partial<Record<AppLocale, string>>;

export const DEFAULT_CONTENT_LOCALE: AppLocale = routing.defaultLocale;

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
