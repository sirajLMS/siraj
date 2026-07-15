"use client";

import { createContext, useContext } from "react";
import type { AppLocale } from "@/shared/locale/AppLocale";
import type { MessageSchema } from "@/shared/locale/types/message";

interface LocaleContextValue {
  translations: Partial<MessageSchema>;
  locale: AppLocale;
}

/**
 * React context that holds the pre-loaded translation object and current locale.
 * Populated server-side by the root layout and passed down to all
 * client components via LocaleProvider.
 */
export const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface LocaleProviderProps {
  children: React.ReactNode;
  translations: Partial<MessageSchema>;
  locale: AppLocale;
}

/**
 * Wraps the app (or a subtree) with the locale translations context.
 * Place this in app/[locale]/layout.tsx, passing server-loaded translations.
 *
 * Example:
 *   const t = await getTranslations(locale, "auth");
 *   <LocaleProvider translations={{ auth: t }} locale={locale}>{children}</LocaleProvider>
 */
export function LocaleProvider({ children, translations, locale }: Readonly<LocaleProviderProps>) {
  return <LocaleContext.Provider value={{ translations, locale }}>{children}</LocaleContext.Provider>;
}

/**
 * Internal hook — reads the raw locale context.
 * Consumers should use useAppTranslation or useAppLocale instead.
 */
export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be called inside <LocaleProvider>");
  }
  return ctx;
}

/**
 * Returns the current app locale ("ar" or "en").
 * Replaces next-intl's useLocale().
 */
export function useAppLocale(): AppLocale {
  return useLocaleContext().locale;
}
