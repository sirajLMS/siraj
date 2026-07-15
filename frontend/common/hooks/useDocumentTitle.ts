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
      const translation = t[fallbackKey as keyof typeof t];
      if (typeof translation === "function") {
        // Handle function translations (like documentTitleTemplate)
        documentTitle = `${translation(values as never)} | ${APP_NAME}`;
      } else {
        documentTitle = `${translation} | ${APP_NAME}`;
      }
    } else {
      return;
    }

    document.title = documentTitle;
  }, [title, fallbackKey, t, values]);
}
