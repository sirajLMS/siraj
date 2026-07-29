"use client";

import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";

export function useTranslation<TLabels>(handle: NamespaceHandle<TLabels>, locale: AppLocale): TLabels {
  return readTranslation(handle, locale);
}
