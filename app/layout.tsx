import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
import { getThemeFromCookies, THEME_COOKIE_NAME } from "@/frontend/common/lib/theme-detection";
import { LocaleProvider } from "@/frontend/common/providers/LocaleProvider";
import MuiProvider from "@/frontend/common/providers/theme/MuiProvider";
import "@/app/index.css";
import { AppApolloProvider } from "@/frontend/common/context";
import { AuthProvider } from "@/frontend/common/providers/apollo/AuthProvider";
import { getLocale, getTranslations, loadAllTranslations } from "@/shared/locale/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).commonTranslations;
  return {
    metadataBase: new URL(NEXT_PUBLIC_BASE_URL),
    title: {
      default: t.title,
      template: t.documentTitleTemplate("%s"),
    },
    description: t.description,
    applicationName: t.title,
    openGraph: {
      title: t.title,
      description: t.description,
      siteName: t.title,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t.title,
      description: t.description,
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();

  // Load ALL translation namespaces server-side for LocaleProvider.
  const allTranslations = loadAllTranslations(locale);

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
          attribute="data" // match `colorSchemeSelector: "data"` in `createAppCssVarsTheme`
          defaultMode={initialTheme}
          modeStorageKey="theme" // match the existing localStorage key from `theme-detection.ts`
        />
        {/* Our compile-time locale provider — grows as namespaces are migrated */}
        <LocaleProvider translations={allTranslations} locale={locale}>
          <MuiProvider initialTheme={initialTheme}>
            <AppApolloProvider>
              <AuthProvider>{children}</AuthProvider>
            </AppApolloProvider>
          </MuiProvider>
        </LocaleProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
