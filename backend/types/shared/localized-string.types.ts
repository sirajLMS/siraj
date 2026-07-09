import type { AppLocale } from "@/shared/i18n/routing";
import { locales, routing } from "@/shared/i18n/routing";

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
