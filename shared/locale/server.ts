import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";
import { arMessages } from "@/shared/locale/ar/messages";
import { enMessages } from "@/shared/locale/en/messages";
import type { Translations } from "@/shared/locale/types/message";

const messagesByLocale: Record<AppLocale, Translations> = {
  ar: arMessages,
  en: enMessages,
};

function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

function resolveLocale(locale: string): AppLocale {
  return isAppLocale(locale) ? locale : defaultLocale;
}

export function getTranslations(locale: string): Translations {
  return messagesByLocale[resolveLocale(locale)];
}

export function loadAllTranslations(locale: string): Translations {
  return getTranslations(locale);
}
