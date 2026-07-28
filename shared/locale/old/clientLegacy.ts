"use client";

import { useAppLocale, useLocaleContext } from "@/shared/locale/localeContext.tsx";
import type { Translations } from "@/shared/locale/types/old/message.ts";

export function useAppTranslation(): Translations {
  return useLocaleContext().translations;
}

export { useAppLocale };
