import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale.ts";
import { messagesByLocale } from "@/shared/locale/old/messagesLegacy.ts";
import type { Translations } from "@/shared/locale/types/old/message.ts";

export function getTranslations(locale: string): Translations {
  return messagesByLocale[(locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale];
}

export function loadAllTranslations(locale: string): Translations {
  return getTranslations(locale);
}
