import { cookies, headers } from "next/headers";
import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";
import { messagesByLocale } from "@/shared/locale/messages";
import type { Translations } from "@/shared/locale/types/message";

export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  if (localeCookie?.value && (locales as readonly string[]).includes(localeCookie.value)) {
    return localeCookie.value as AppLocale;
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.includes("ar")) return "ar";
    if (acceptLanguage.includes("en")) return "en";
  }

  return defaultLocale;
}

export function getTranslations(locale: string): Translations {
  return messagesByLocale[(locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale];
}

export function loadAllTranslations(locale: string): Translations {
  return getTranslations(locale);
}
