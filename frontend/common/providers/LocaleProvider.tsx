"use client";

import type * as React from "react";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { LocaleContext } from "@/shared/locale/localeContext";
import type { MessageSchema } from "@/shared/locale/types/message";

export interface LocaleProviderProps {
  readonly children: React.ReactNode;
  readonly translations: Partial<MessageSchema>;
  readonly locale: AppLocale;
}

/**
 * Wraps the app (or a subtree) with the locale translations context.
 * Place this in app/[locale]/layout.tsx, passing server-loaded translations.
 *
 * The context object and hooks (`LocaleContext`, `useAppLocale`,
 * `useLocaleContext`) live in `@/shared/locale/localeContext` so that
 * `shared/locale/client.ts` can consume the hooks without crossing the
 * shared → frontend dependency boundary, and so this file only exports a
 * single component (Fast Refresh friendly).
 *
 * Example:
 *   const t = await getTranslations(locale, "auth");
 *   <LocaleProvider translations={{ auth: t }} locale={locale}>{children}</LocaleProvider>
 */
export function LocaleProvider({ children, translations, locale }: Readonly<LocaleProviderProps>): React.ReactNode {
  return <LocaleContext.Provider value={{ translations, locale }}>{children}</LocaleContext.Provider>;
}
