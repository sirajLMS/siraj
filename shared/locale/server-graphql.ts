import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";
import type { MessageSchema } from "@/shared/locale/types/message";

/**
 * Internal helper: loads a translation namespace from disk.
 * This is the same logic as in server.ts but without next/headers dependency.
 */
async function loadTranslation<K extends keyof MessageSchema>(
  safeLocale: AppLocale,
  namespace: K
): Promise<MessageSchema[K]> {
  const namespacePaths: Record<keyof MessageSchema, string> = {
    auth: "auth/index",
    common: "common/index",
    errors: "errors/index",
    "dashboard.admin": "dashboard/admin/index",
    "dashboard.core.layout": "dashboard/core/layout",
    "dashboard.core.notifications": "dashboard/core/notifications",
    profile: "profile",
    session: "session/index",
    ui: "ui/index",
  };

  const filePath = namespacePaths[namespace];
  const mod = await import(`@/shared/locale/${safeLocale}/${filePath}`);

  const segments = filePath.split("/");
  const exportName = segments.length >= 2 ? segments[segments.length - 2] : segments[0];
  return mod[exportName] as MessageSchema[K];
}

/**
 * Backend-safe translation loader for GraphQL resolvers, scripts, tests, etc.
 * Takes locale as a plain string argument (no Next.js deps).
 *
 * Usage in a GraphQL mutation:
 *   const t = await getServerTranslations(ctx.locale, "errors");
 *   throw new GraphQLError(t.auth.invalidCredentials);
 */
export async function getServerTranslations<K extends keyof MessageSchema>(
  locale: string,
  namespace: K
): Promise<MessageSchema[K]> {
  const safeLocale: AppLocale = (locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale;
  return loadTranslation(safeLocale, namespace);
}
