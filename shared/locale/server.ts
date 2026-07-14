import { cookies, headers } from "next/headers";
import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";
import type { MessageSchema } from "@/shared/locale/types/message";

/**
 * Answer to "does it only load needed strings?":
 * YES. Each call to getTranslations / getServerTranslations does a single
 * dynamic `import()` of ONE file (e.g. shared/locale/ar/errors/index.ts).
 * Node.js caches the module after the first import, so repeated calls for
 * the same locale+namespace are essentially free — no network, no parsing.
 * The whole MessageSchema is never loaded at once.
 */

/**
 * Maps a MessageSchema namespace key to its file path under shared/locale/{locale}/
 * Needed for dotted keys like "dashboard.admin" which live at "dashboard/admin/index".
 */
const namespacePaths: Record<keyof MessageSchema, string> = {
  auth: "auth/index",
  errors: "errors/index",
  "dashboard.admin": "dashboard/admin/index",
};

/**
 * Resolves the current locale from cookies or Accept-Language header,
 * falling back to the default locale. Mirrors the logic that was in
 * shared/i18n/request.ts for next-intl.
 */
export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE");
  if (localeCookie?.value && (locales as readonly string[]).includes(localeCookie.value)) {
    return localeCookie.value as AppLocale;
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.includes("ar")) return "ar";
    if (acceptLanguage.includes("en")) return "en";
  }

  return defaultLocale;
}

/**
 * Lazily loads a single translation namespace for a given locale.
 *
 * Usage in Server Components:
 *   const t = await getTranslations(locale, "dashboard.admin");
 *   return <p>{t.paginationRange(1, 10, 87)}</p>; // compile-time safe
 *
 * Usage in API Routes:
 *   const t = await getTranslations(locale, "auth");
 *   return NextResponse.json({ error: t.login.invalidCredentials }, { status: 401 });
 */
export async function getTranslations<K extends keyof MessageSchema>(
  locale: string,
  namespace: K
): Promise<MessageSchema[K]> {
  const safeLocale: AppLocale = (locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale;

  const filePath = namespacePaths[namespace];
  const mod = await import(`@/shared/locale/${safeLocale}/${filePath}`);

  // The exported name is the last path segment before "index" (e.g. "auth", "admin", "errors")
  const segments = filePath.split("/");
  const exportName = segments.length >= 2 ? segments[segments.length - 2] : segments[0];
  return mod[exportName] as MessageSchema[K];
}

/**
 * Backend-safe translation loader — identical to getTranslations but takes
 * the locale as a plain string argument instead of reading from cookies/headers.
 *
 * Use this in:
 *   - GraphQL resolvers  (ctx.locale is already resolved by gqlContextFactory)
 *   - REST API routes    (read locale from request header yourself)
 *   - Database seeds / scripts (pass "en" or "ar" directly)
 *   - Tests              (no Next.js request context available)
 *
 * This function has NO dependency on next/headers, so it is safe outside
 * the Next.js request lifecycle.
 *
 * Usage in a GraphQL mutation:
 *   const t = await getServerTranslations(ctx.locale, "errors");
 *   throw new GraphQLError(t.auth.invalidCredentials);
 *              // ↑ compile-time checked property — not a string lookup
 */
export async function getServerTranslations<K extends keyof MessageSchema>(
  locale: string,
  namespace: K
): Promise<MessageSchema[K]> {
  // Reuse the same lazy-loading logic — just skip the cookie/header step
  const safeLocale: AppLocale = (locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale;

  const filePath = namespacePaths[namespace];
  const mod = await import(`@/shared/locale/${safeLocale}/${filePath}`);

  const segments = filePath.split("/");
  const exportName = segments.length >= 2 ? segments[segments.length - 2] : segments[0];
  return mod[exportName] as MessageSchema[K];
}
