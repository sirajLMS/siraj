"use client";

import type * as React from "react";
import { type AppLocale, LocaleContext, messagesByLocale } from "@/shared/locale";

export interface LocaleProviderProps {
  readonly children: React.ReactNode;
  readonly locale: AppLocale;
}

export function LocaleProvider({ children, locale }: Readonly<LocaleProviderProps>): React.ReactNode {
  const translations = messagesByLocale[locale];
  return <LocaleContext.Provider value={{ translations, locale }}>{children}</LocaleContext.Provider>;
}
