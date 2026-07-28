"use client";

import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { useAppLocale } from "@/shared/locale/localeContext";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";

export function useAppTranslation<TLabels>(handle: NamespaceHandle<TLabels>): TLabels {
  const locale = useAppLocale();
  return readTranslation(handle, locale);
}
