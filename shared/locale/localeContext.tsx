"use client";

import { createContext, useContext } from "react";
import type { AppLocale } from "@/shared/locale/AppLocale";
import type { MessageSchema } from "@/shared/locale/types/message";

export interface LocaleContextValue {
  translations: Partial<MessageSchema>;
  locale: AppLocale;
}

/**
 * React context that holds the pre-loaded translation object and current locale.
 * Lives in `shared/` so both `shared/locale/client.ts` (hooks) and the
 * frontend `LocaleProvider` (provider component) can depend on it without
 * crossing the shared → frontend dependency boundary.
 *
 * Populated server-side by the root layout and passed down to all
 * client components via the frontend LocaleProvider.
 */
export const LocaleContext = createContext<LocaleContextValue | null>(null);

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
