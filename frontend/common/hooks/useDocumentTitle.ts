"use client";

import { useEffect } from "react";
import { useAppTranslation } from "@/shared/locale/client";

const APP_NAME = "Siraj";

export function useDocumentTitle(
  title: string | null | undefined,
  fallbackNamespace?: string,
  fallbackKey?: string,
  values?: Record<string, string | number>
): void {
  const t = useAppTranslation(fallbackNamespace ?? "common");

  useEffect(() => {
    let documentTitle: string;

    if (title) {
      documentTitle = `${title} | ${APP_NAME}`;
    } else if (fallbackKey) {
      const translated = values ? t[fallbackKey as keyof typeof t](values as never) : t[fallbackKey as keyof typeof t];
      documentTitle = `${translated} | ${APP_NAME}`;
    } else {
      return;
    }

    document.title = documentTitle;
  }, [title, fallbackKey, t, values]);
}
