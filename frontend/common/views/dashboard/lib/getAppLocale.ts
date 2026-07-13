import { cookies } from "next/headers";
import { type AppLocale, locales } from "@/shared/i18n/routing";

export async function getAppLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");

  if (localeCookie?.value && locales.includes(localeCookie.value as AppLocale)) {
    return localeCookie.value as AppLocale;
  }

  return "ar";
}
