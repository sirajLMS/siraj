"use client";

import { useBetaTranslation } from "@/shared/locale/beta/beta-translation-cache";
import type { BetaNamespaceHandle } from "@/shared/locale/beta/define-beta-namespace";
import { useAppLocale } from "@/shared/locale/localeContext";

export function useAppTranslationBeta<TLabels>(handle: BetaNamespaceHandle<TLabels>): TLabels {
  const locale = useAppLocale();
  return useBetaTranslation(handle, locale);
}
