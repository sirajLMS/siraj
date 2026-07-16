import { cookies, headers } from "next/headers";
import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";

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
