import { cookies, headers } from "next/headers";
import type { AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";

async function getLocale() {
  // Get locale from cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  if (localeCookie?.value && ["ar", "en"].includes(localeCookie.value)) {
    return localeCookie.value;
  }

  // Fallback to Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.includes("ar")) return "ar";
    if (acceptLanguage.includes("en")) return "en";
  }

  // Default to Arabic
  return "ar";
}

export default getRequestConfig(async () => {
  const locale = await getLocale();

  const messages = (await import(`../messages/${locale}`)) as { default: AbstractIntlMessages };

  return {
    locale,
    messages: messages.default,
  };
});
