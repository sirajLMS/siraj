"use client";

import { useEffect } from "react";
import { useAppTranslation } from "@/shared/locale";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";

const APP_NAME = "Siraj";

type FallbackFn = (v?: Record<string, string | number>) => string;

function isFallbackFn(value: unknown): value is FallbackFn {
  return typeof value === "function";
}

export function useDocumentTitle<TLabels>(
  title: string | null | undefined,
  namespace: NamespaceHandle<TLabels>,
  fallbackKey: keyof TLabels & string,
  values?: Record<string, string | number>
): void {
  const labels = useAppTranslation(namespace);
  const fallback = labels[fallbackKey];

  useEffect(() => {
    let documentTitle: string;

    if (title) {
      documentTitle = `${title} | ${APP_NAME}`;
    } else if (isFallbackFn(fallback)) {
      documentTitle = `${fallback(values)} | ${APP_NAME}`;
    } else if (typeof fallback === "string") {
      documentTitle = `${fallback} | ${APP_NAME}`;
    } else {
      return;
    }

    document.title = documentTitle;
  }, [title, fallback, values]);
}
