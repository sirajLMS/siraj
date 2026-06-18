import { getTranslations } from "next-intl/server";
import { logger } from "@/backend/lib/logger";
import ar from "@/shared/messages/ar";
import en from "@/shared/messages/en";

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
    let template = namespaceObj?.[key];

    if (typeof template !== "string") {
      // Fallback: try English if Arabic fails or vice versa
      const fallbackMessages = locale === "en" ? ar : en;
      const fallbackNamespaceObj = resolveNamespace(fallbackMessages, namespace);
      const fallbackTemplate = fallbackNamespaceObj?.[key];
      template = typeof fallbackTemplate === "string" ? fallbackTemplate : key;
    }

    if (typeof template !== "string") {
      return key;
    }

    if (!values) return template;

    return template.replace(/\{(\w+)\}/g, (match, paramName) => {
      const val = values[paramName];

      // 1. If undefined, leave the tag as is
      if (val === undefined) {
        return match;
      }

      // 2. Safe primitives check: SonarQube can see that structural objects cannot pass this check
      if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
        return String(val);
      }

      // 3. Fallback for structural objects, arrays, or null to prevent [object Object]
      return val ? JSON.stringify(val) : "";
    });
  };
}

export async function getBackendTranslations(opts?: { locale?: string; namespace?: string }) {
  const namespace = opts?.namespace || "common";

  // Detect if we are running in a test suite.
  // We check process.env, VITEST, and process.argv (to catch bun test even if NODE_ENV is overridden to development by dotenv)
  const isTest =
    process.env.NODE_ENV === "test" ||
    !!process.env.VITEST ||
    !!process.env.BUN_ENV ||
    (typeof process !== "undefined" &&
      Array.isArray(process.argv) &&
      process.argv.some(arg => arg.includes("test") || arg.endsWith("test") || arg.includes("vitest")));

  const locale = opts?.locale || (isTest ? "en" : "ar");

  if (isTest) {
    return getManualTranslations(locale, namespace);
  }

  try {
    if (opts?.locale) {
      return await getTranslations({ locale: opts.locale, namespace });
    }
    return await getTranslations(namespace);
  } catch (error) {
    // Graceful fallback outside Next.js request context (e.g. scripts, tests, seeders)
    logger.debug("Failed to retrieve next-intl translations, falling back to manual resolver", { error });
    return getManualTranslations(locale, namespace);
  }
}
