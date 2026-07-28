import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale.ts";
import { messagesByLocale } from "@/shared/locale/old/messagesLegacy.ts";
import type { Translations } from "@/shared/locale/types/old/message.ts";

export function getServerTranslations(locale: string): Translations {
  return messagesByLocale[(locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale];
}
