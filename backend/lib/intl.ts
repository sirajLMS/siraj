import { logger } from "@/backend/lib/logger";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { MessageSchema } from "@/shared/locale/types/message";
import type { SessionLabels } from "@/shared/locale/types/session";

/**
 * Compatibility wrapper: provides the old string-key API on top of the new typed objects.
 * Usage: const t = await getBackendTranslations({ locale, namespace: "errors" });
   10|  *        t("auth.unauthorizedAction") // works like old next-intl
 *
 * Also supports dotted namespace paths like "emails.complaintResponse" for backwards compatibility.
 */
export async function getBackendTranslations(opts: {
  locale?: string;
  namespace: keyof MessageSchema | string;
}): Promise<Record<string, unknown> & ((key: string, values?: Record<string, unknown>) => string)> {
  const locale = opts?.locale ?? "ar";

  // Handle dotted namespace paths (e.g., "emails.complaintResponse" -> namespace "emails", subkey "complaintResponse")
  let namespace: keyof MessageSchema;
  let subPath: string | undefined;

  if (typeof opts.namespace === "string" && opts.namespace.includes(".")) {
    const parts = opts.namespace.split(".");
    namespace = parts[0] as keyof MessageSchema;
    subPath = parts.slice(1).join(".");
  } else {
    namespace = opts.namespace as keyof MessageSchema;
  }

  const translations = await getServerTranslations(locale, namespace);

  // If subPath is provided, navigate to that sub-object
  let targetTranslations: unknown = translations;
  if (subPath) {
    const parts = subPath.split(".");
    for (const part of parts) {
      if (targetTranslations && typeof targetTranslations === "object" && part in targetTranslations) {
        targetTranslations = (targetTranslations as Record<string, unknown>)[part];
      } else {
        logger.warn(`[getBackendTranslations] Missing translation sub-path: ${subPath} in namespace ${namespace}`);
        targetTranslations = {};
        break;
      }
    }
  }

  // Create a callable function that does dot-notation lookup
  const t = (key: string, values?: Record<string, unknown>): string => {
    const parts = key.split(".");
    let current: unknown = targetTranslations;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        logger.warn(`[getBackendTranslations] Missing translation key: ${key} in namespace ${opts.namespace}`);
        return key;
      }
    }
    let result = String(current);
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return result;
  };

  // Return the translations object with the callable function attached
  // This makes the object itself callable: t("key") works
  return Object.assign(t, targetTranslations as Record<string, unknown>) as Record<string, unknown> &
    ((key: string, values?: Record<string, unknown>) => string);
}

export type { CommonLabels, ErrorsLabels, SessionLabels };
