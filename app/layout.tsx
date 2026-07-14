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
import { getTranslations } from "@/shared/locale/server";

async function getLocale() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  if (localeCookie?.value && ["ar", "en"].includes(localeCookie.value)) {
    return localeCookie.value;
  }
  return "ar";
}

export async function generateMetadata(): Promise<Metadata> {
  // Migrated to compile-time i18n - use getTranslations for "common" namespace
  const locale = await getLocale();
  const t = await getTranslations(locale, "common");
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

  // Load migrated namespaces server-side for LocaleProvider.
  // Add more namespaces here as they are migrated from next-intl.
  const authTranslations = await getTranslations(locale, "auth");
  const commonTranslations = await getTranslations(locale, "common");
  const dashboardAdminTranslations = await getTranslations(locale, "dashboard.admin");

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
        <LocaleProvider
          translations={{
            auth: authTranslations,
            common: commonTranslations,
            "dashboard.admin": dashboardAdminTranslations,
          }}
        >
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
