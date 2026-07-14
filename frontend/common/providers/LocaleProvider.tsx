"use client";

import { createContext, useContext } from "react";
import type { MessageSchema } from "@/shared/locale/types/message";

/**
 * React context that holds the pre-loaded translation object.
 * Populated server-side by the root layout and passed down to all
 * client components via LocaleProvider.
 */
export const LocaleContext = createContext<Partial<MessageSchema> | null>(null);

export interface LocaleProviderProps {
  children: React.ReactNode;
  translations: Partial<MessageSchema>;
}

/**
 * Wraps the app (or a subtree) with the locale translations context.
 * Place this in app/[locale]/layout.tsx, passing server-loaded translations.
 *
 * Example:
 *   const t = await getTranslations(locale, "auth");
 *   <LocaleProvider translations={{ auth: t }}>{children}</LocaleProvider>
 */
export function LocaleProvider({ children, translations }: Readonly<LocaleProviderProps>) {
  return <LocaleContext.Provider value={translations}>{children}</LocaleContext.Provider>;
}

/**
 * Internal hook — reads the raw locale context.
 * Consumers should use useAppTranslation instead.
 */
export function useLocaleContext(): Partial<MessageSchema> {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be called inside <LocaleProvider>");
  }
  return ctx;
}
