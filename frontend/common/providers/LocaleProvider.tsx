"use client";

import { type ReactNode, useMemo } from "react";
import { type AppLocale, LocaleContext, messagesByLocale } from "@/shared/locale";

export interface LocaleProviderProps {
  readonly children: ReactNode;
  readonly locale: AppLocale;
}

export function LocaleProvider({ children, locale }: Readonly<LocaleProviderProps>): ReactNode {
  const value = useMemo(() => {
    const translations = messagesByLocale[locale];
    return { translations, locale };
  }, [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
