"use client";

import { useAppLocale, useLocaleContext } from "./localeContext";
import type { Translations } from "./types/message";

export function useAppTranslation(): Translations {
  return useLocaleContext().translations;
}

export { useAppLocale };
