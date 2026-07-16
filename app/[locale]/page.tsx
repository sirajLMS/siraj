import type { Metadata } from "next";
import { redirect as nextRedirect } from "next/navigation";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import type { RedirectOptions } from "@/shared/i18n/routing";
import { type AppLocale, getTranslations, locales } from "@/shared/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).commonTranslations;
  return { title: t.title };
}

// Local copy of the routing.redirect signature — bypasses the "use client"
// wrapper in `@/shared/i18n/routing` so server components can call `redirect`
// without dragging client-only navigation hooks into the server bundle.
function redirect(options: RedirectOptions): never;
function redirect(href: string): never;
function redirect(hrefOrOptions: string | RedirectOptions): never {
  const href = typeof hrefOrOptions === "string" ? hrefOrOptions : hrefOrOptions.href;
  nextRedirect(href);
}

export default async function RootPage({ params }: { readonly params: Promise<{ locale: string }> }) {
  let { locale } = await params;

  if (!locales.includes(locale as AppLocale)) {
    locale = locales[0];
  }

  const { userId, context } = await getServerUserContext();
  if (userId && context) {
    redirect({ href: "/dashboard", locale });
  } else {
    await redirectToLogin(locale);
  }

  return null;
}
