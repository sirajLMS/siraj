import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";
import { messagesByLocale } from "@/shared/locale/messages";
import type { Translations } from "@/shared/locale/types/message";

export function getServerTranslations(locale: string): Translations {
  return messagesByLocale[(locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale];
}
