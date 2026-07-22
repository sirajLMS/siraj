"use client";

import { createContext, useContext } from "react";
import type { AppLocale } from "@/shared/locale/AppLocale";
import type { Translations } from "@/shared/locale/types/message";

export interface LocaleContextValue {
  translations: Translations;
  locale: AppLocale;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be called inside <LocaleProvider>");
  }
  return ctx;
}

export function useAppLocale(): AppLocale {
  return useLocaleContext().locale;
}
