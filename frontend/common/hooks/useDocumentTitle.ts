"use client";

import { useEffect } from "react";
import { useAppTranslation } from "@/shared/locale/client";

const APP_NAME = "Siraj";

export function useDocumentTitle(
  title: string | null | undefined,
  fallbackNamespace?: keyof import("@/shared/locale/types/message").MessageSchema,
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
        documentTitle = `${(translation as (v?: Record<string, string | number>) => string)(values)} | ${APP_NAME}`;
      } else if (typeof translation === "string") {
        documentTitle = `${translation} | ${APP_NAME}`;
      } else {
        return;
      }
    } else {
      return;
    }

    document.title = documentTitle;
  }, [title, fallbackKey, t, values]);
}
