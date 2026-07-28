"use client";

import { type ReactNode, useMemo } from "react";
import { type AppLocale, LocaleContext, TranslationProvider } from "@/shared/locale";

export interface LocaleProviderProps {
  readonly children: ReactNode;
  readonly locale: AppLocale;
}

export function LocaleProvider({ children, locale }: Readonly<LocaleProviderProps>): ReactNode {
  const value = useMemo(() => ({ locale }), [locale]);
  return (
    <LocaleContext.Provider value={value}>
      <TranslationProvider>{children}</TranslationProvider>
    </LocaleContext.Provider>
  );
}
