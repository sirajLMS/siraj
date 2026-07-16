"use client";

import { useEffect } from "react";
import { useAppTranslation } from "@/shared/locale/client";
import type { Translations } from "@/shared/locale/types/message";

const APP_NAME = "Siraj";

type NamespaceKey = "auth" | "common" | "errors" | "emails" | "session" | "sms" | "ui" | "dashboard" | "profile";

const NAMESPACE_TO_GROUP: Record<NamespaceKey, keyof Translations> = {
  auth: "authTranslations",
  common: "commonTranslations",
  errors: "errorsTranslations",
  emails: "emailsTranslations",
  session: "sessionTranslations",
  sms: "smsTranslations",
  ui: "uiTranslations",
  dashboard: "dashboardTranslations",
  profile: "profileTranslations",
};

/**
 * Selecting a single-segment namespace selects the group collector.
 * For `profile` the legacy `"profile"` key maps to `.profileTranslations.base`
 * (the page-level labels) per the migration rules — and `"dashboard"` alone
 * has no equivalent single-segment key, so callers always pass a dotted path.
 * For `ui`/`dashboard` sub-segments, camelCase each segment joined without dots
 * (e.g. `"dashboard.studentProfile"` → `.dashboardTranslations.studentProfile`).
 */
function resolveNamespace(translations: Translations, dotted: string): Record<string, unknown> {
  const parts = dotted.split(".");
  const head = parts[0] as NamespaceKey;
  const groupKey = NAMESPACE_TO_GROUP[head] ?? "commonTranslations";
  let target: unknown = translations[groupKey];
  const subParts = parts.slice(1);
  // Plain "profile" (no sub-segment) maps to .base per the migration rules.
  if (head === "profile" && subParts.length === 0) {
    target = (target as { base: unknown }).base;
  } else if (subParts.length === 1) {
    const camelKey = subParts[0];
    if (target && typeof target === "object" && camelKey in (target as object)) {
      target = (target as Record<string, unknown>)[camelKey];
    } else {
      return {};
    }
  } else if (subParts.length > 1) {
    const camelKey = subParts.map((seg, i) => (i === 0 ? seg : seg[0].toUpperCase() + seg.slice(1))).join("");
    if (target && typeof target === "object" && camelKey in (target as object)) {
      target = (target as Record<string, unknown>)[camelKey];
    } else {
      return {};
    }
  }
  return (target ?? {}) as Record<string, unknown>;
}

export function useDocumentTitle(
  title: string | null | undefined,
  fallbackNamespace?: NamespaceKey | string,
  fallbackKey?: string,
  values?: Record<string, string | number>
): void {
  const translations = useAppTranslation();
  const t = resolveNamespace(translations, fallbackNamespace ?? "common");

  useEffect(() => {
    let documentTitle: string;

    if (title) {
      documentTitle = `${title} | ${APP_NAME}`;
    } else if (fallbackKey) {
      const translation = t[fallbackKey];
      if (typeof translation === "function") {
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
