"use client";

import { useAppLocale, useLocaleContext } from "@/shared/locale/localeContext";
import type { Translations } from "@/shared/locale/types/message";

export function useAppTranslation(): Translations {
  return useLocaleContext().translations;
}

export { useAppLocale };
