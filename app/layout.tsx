import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { logger } from "@/backend/lib/logger";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
import { buildServerThemeCss } from "@/frontend/common/lib/server-theme-css";
import { getThemeFromCookies, THEME_COOKIE_NAME } from "@/frontend/common/lib/theme-detection";
import { LocaleProvider } from "@/frontend/common/providers/LocaleProvider";
import MuiProvider from "@/frontend/common/providers/theme/MuiProvider";
import { VercelObservability } from "@/frontend/common/providers/VercelObservability";
import "@/app/index.css";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

/**
 * Self-host Inter via next/font. next/font downloads the font files at build
 * time, serves them from the same origin as the app (no external request),
 * and automatically adds a <link rel="preload"> in <head> for zero CLS.
 *
 * Variable font: a single @font-face covers the full weight range (100-900)
 * instead of one @font-face per weight. Next.js recommends variable fonts
 * "for the best performance and flexibility" — fewer requests, smaller
 * payload, full weight axis available for runtime weight changes. Keep
 * `latin-ext` subset for European text coverage used by `shared/locale/`.
 */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Hanken Grotesk — used for headings in the MUI theme.
 * Variable font: single @font-face over the full weight range.
 */
const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME);
  const initialTheme = getThemeFromCookies(themeCookie?.value);

  logger.info("[RootLayout] Server theme detection", {
    themeCookieRaw: themeCookie?.value ?? null,
    initialTheme,
    locale,
  });

  const direction = locale === "ar" ? "rtl" : "ltr";
  const serverThemeCss = buildServerThemeCss(initialTheme);

  return (
    <html
      lang={locale}
      dir={direction}
      data-mui-color-scheme={initialTheme}
      data-theme={initialTheme}
      suppressHydrationWarning
      className={`${inter.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {process.env.NODE_ENV === "production" ? (
          <script
            nonce={nonce}
            // Browsers hide nonce from the DOM after parse; suppress expected SSR/client mismatch.
            suppressHydrationWarning
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Service worker registration script
            dangerouslySetInnerHTML={{
              __html:
                "if('serviceWorker' in navigator && window.isSecureContext){navigator.serviceWorker.register('/sw.js?build=" +
                process.env.NEXT_PUBLIC_BUILD_ID +
                "').catch(function(){});}",
            }}
          />
        ) : (
          <script
            nonce={nonce}
            // Browsers hide nonce from the DOM after parse; suppress expected SSR/client mismatch.
            suppressHydrationWarning
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Unregister stale SW left over from prod-mode caching of Turbopack chunks
            dangerouslySetInnerHTML={{
              __html:
                "if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister();});}).catch(function(){});caches.keys().then(function(k){k.filter(function(n){return n.indexOf('siraj-static-chunks-')===0||n.indexOf('siraj-api-')===0;}).forEach(function(n){caches.delete(n);});}).catch(function(){});}",
            }}
          />
        )}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Safe server-side generated theme CSS variables */}
        <style id="server-theme-css" dangerouslySetInnerHTML={{ __html: serverThemeCss }} />
      </head>
      <body style={{ overflow: "hidden" }}>
        {/* Must come before the main content. Sets the initial color-scheme
            attribute on <html> from localStorage/cookie before hydration so the
            cssVars-aware ThemeProvider paints the user's preferred mode on the
            very first render — no dark-mode hydration flash. `defaultMode`
            matches the cookie value read above and passed to MuiProvider. */}
        <InitColorSchemeScript attribute="data" defaultMode={initialTheme} modeStorageKey="theme" nonce={nonce} />
        <LocaleProvider locale={locale}>
          <MuiProvider initialTheme={initialTheme} nonce={nonce}>
            {children}
          </MuiProvider>
        </LocaleProvider>
        <VercelObservability />
      </body>
    </html>
  );
}
