"use client";

import type * as React from "react";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { LocaleContext } from "@/shared/locale/localeContext";
import type { Translations } from "@/shared/locale/types/message";

export interface LocaleProviderProps {
  readonly children: React.ReactNode;
  readonly translations: Translations;
  readonly locale: AppLocale;
}

export function LocaleProvider({ children, translations, locale }: Readonly<LocaleProviderProps>): React.ReactNode {
  return <LocaleContext.Provider value={{ translations, locale }}>{children}</LocaleContext.Provider>;
}
