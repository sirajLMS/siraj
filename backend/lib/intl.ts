import { getTranslations } from "next-intl/server";
import { logger } from "@/backend/lib/logger";
import ar from "@/shared/messages/ar";
import en from "@/shared/messages/en";
import type { CommonLabels } from "@/shared/messages/types/common";
import type { NotificationsLabels } from "@/shared/messages/types/dashboard/core/notifications";
import type { ErrorsLabels } from "@/shared/messages/types/errors";
import type { SessionLabels } from "@/shared/messages/types/session";

interface BackendNamespaceMap {
  errors: ErrorsLabels;
  session: SessionLabels;
  common: CommonLabels;
  "dashboard.notifications": NotificationsLabels;
}

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? K | `${K}.${NestedKeyOf<T[K]>}` : K;
    }[keyof T & string]
  : never;

export type TranslationFn<T> = (key: NestedKeyOf<T>, values?: Record<string, unknown>) => string;

type BackendTranslationFn =
  | TranslationFn<ErrorsLabels>
  | TranslationFn<SessionLabels>
  | TranslationFn<CommonLabels>
  | TranslationFn<NotificationsLabels>;

export type BackendNamespace = keyof BackendNamespaceMap;

function resolveNamespace(messages: unknown, namespace: string): Record<string, unknown> | undefined {
  if (!namespace) {
    return messages as Record<string, unknown>;
  }
  let currentObj = messages as Record<string, unknown>;
  const parts = namespace.split(".");
  for (const part of parts) {
    if (currentObj && typeof currentObj === "object") {
      currentObj = currentObj[part] as Record<string, unknown>;
    } else {
      return undefined;
    }
  }
  return currentObj;
}

function getManualTranslations(locale: string, namespace: string) {
  const messages = locale === "en" ? en : ar;
  const namespaceObj = resolveNamespace(messages, namespace);

  return (key: string, values?: Record<string, unknown>) => {
    let template = resolveNamespace(namespaceObj, key) as unknown;

    if (typeof template !== "string") {
      const fallbackMessages = locale === "en" ? ar : en;
      const fallbackNamespaceObj = resolveNamespace(fallbackMessages, namespace);
      const fallbackTemplate = resolveNamespace(fallbackNamespaceObj, key) as unknown;
      template = typeof fallbackTemplate === "string" ? fallbackTemplate : key;
    }

    if (typeof template !== "string") {
      return key;
    }

    if (!values) return template;

    return template.replace(/\{(\w+)\}/g, (match, paramName) => {
      const val = values[paramName];

      if (val === undefined) {
        return match;
      }

      if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
        return String(val);
      }

      return val ? JSON.stringify(val) : "";
    });
  };
}

export async function getBackendTranslations(opts: {
  locale?: string;
  namespace: "errors";
}): Promise<TranslationFn<ErrorsLabels>>;
export async function getBackendTranslations(opts: {
  locale?: string;
  namespace: "session";
}): Promise<TranslationFn<SessionLabels>>;
export async function getBackendTranslations(opts: {
  locale?: string;
  namespace: "dashboard.notifications";
}): Promise<TranslationFn<NotificationsLabels>>;
export async function getBackendTranslations(opts: {
  locale?: string;
  namespace?: string;
}): Promise<BackendTranslationFn>;
export async function getBackendTranslations(): Promise<TranslationFn<CommonLabels>>;
export async function getBackendTranslations(opts?: {
  locale?: string;
  namespace?: string;
}): Promise<BackendTranslationFn> {
  const namespace = opts?.namespace || "common";

  const isTest =
    process.env.NODE_ENV === "test" ||
    !!process.env.VITEST ||
    !!process.env.BUN_ENV ||
    (typeof process !== "undefined" &&
      Array.isArray(process.argv) &&
      process.argv.some(arg => arg.includes("test") || arg.endsWith("test") || arg.includes("vitest")));

  const locale = opts?.locale || (isTest ? "en" : "ar");

  if (isTest) {
    return getManualTranslations(locale, namespace) as BackendTranslationFn;
  }

  try {
    if (opts?.locale) {
      return (await getTranslations({ locale: opts.locale, namespace })) as BackendTranslationFn;
    }
    return (await getTranslations(namespace)) as BackendTranslationFn;
  } catch (error) {
    logger.debug("Failed to retrieve next-intl translations, falling back to manual resolver", { error });
    return getManualTranslations(locale, namespace) as BackendTranslationFn;
  }
}
