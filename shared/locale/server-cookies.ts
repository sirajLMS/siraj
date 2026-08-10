import { cookies, headers } from "next/headers";
import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";

const VALID_LOCALES = new Set<string>(locales);

function isAppLocale(value: string): value is AppLocale {
  return VALID_LOCALES.has(value);
}

export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  if (localeCookie?.value && isAppLocale(localeCookie.value)) {
    return localeCookie.value;
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.includes("ar")) return "ar";
    if (acceptLanguage.includes("en")) return "en";
  }

  return defaultLocale;
}
