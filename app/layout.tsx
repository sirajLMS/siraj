import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
import { getThemeFromCookies, THEME_COOKIE_NAME } from "@/frontend/lib/theme-detection";
import MuiProvider from "@/frontend/providers/theme/MuiProvider";
import "@/app/index.css";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    metadataBase: new URL(NEXT_PUBLIC_BASE_URL),
    title: {
      default: t("title"),
      template: t("documentTitleTemplate"),
    },
    description: t("description"),
    applicationName: t("title"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: t("title"),
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("description"),
    },
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
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body style={{ overflow: "hidden" }}>
        {/* Must come before the main content. Sets the initial color-scheme
            attribute on <html> from localStorage/cookie before hydration so the
            cssVars-aware ThemeProvider paints the user's preferred mode on the
            very first render — no dark-mode hydration flash. `defaultMode`
            matches the cookie value read above and passed to MuiProvider. */}
        <InitColorSchemeScript
          defaultMode={initialTheme}
          modeStorageKey="theme" // match the existing localStorage key from `theme-detection.ts`
        />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <MuiProvider initialTheme={initialTheme}>
            <AppApolloProvider>
              <AuthProvider>{children}</AuthProvider>
            </AppApolloProvider>
          </MuiProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
