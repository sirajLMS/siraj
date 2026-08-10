import { cookies } from "next/headers";
import { type AppLocale, locales } from "@/shared/i18n/routing";

function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export async function getAppLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  const cookieValue = localeCookie?.value;

  if (cookieValue !== undefined && isAppLocale(cookieValue)) {
    return cookieValue;
  }

  return "ar";
}
