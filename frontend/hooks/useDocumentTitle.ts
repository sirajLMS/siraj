"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

const APP_NAME = "Siraj";

export function useDocumentTitle(
  title: string | null | undefined,
  fallbackNamespace?: string,
  fallbackKey?: string,
  values?: Record<string, string | number>
): void {
  const t = useTranslations(fallbackNamespace ?? "common");

  useEffect(() => {
    let documentTitle: string;

    if (title) {
      documentTitle = `${title} | ${APP_NAME}`;
    } else if (fallbackKey) {
      const translated = values ? t(fallbackKey, values) : t(fallbackKey);
      documentTitle = `${translated} | ${APP_NAME}`;
    } else {
      return;
    }

    document.title = documentTitle;
  }, [title, fallbackKey, t, values]);
}
