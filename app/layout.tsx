import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { getThemeFromCookies, THEME_COOKIE_NAME } from "@/frontend/lib/theme-detection";
import MuiProvider from "@/frontend/providers/theme/MuiProvider";
import "./index.css";
import { AppApolloProvider } from "@/frontend/context";
import { AuthProvider } from "@/frontend/providers/apollo/AuthProvider";

async function getLocale() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  if (localeCookie?.value && ["ar", "en"].includes(localeCookie.value)) {
    return localeCookie.value;
  }
  return "ar";
}

export async function generateMetadata() {
  const t = await getTranslations("common");
  return {
    title: t("welcome"),
    description: t("description"),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME);
  const initialTheme = getThemeFromCookies(themeCookie?.value);

  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction}>
      <body style={{ overflow: "hidden" }}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <MuiProvider initialTheme={initialTheme}>
            <AppApolloProvider>
              <AuthProvider>{children}</AuthProvider>
            </AppApolloProvider>
          </MuiProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
