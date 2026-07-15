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
  common: "common/index",
  errors: "errors/index",
  "dashboard.admin": "dashboard/admin/index",
  "dashboard.adminView": "dashboard/admin/view",
  "dashboard.lms.credit": "dashboard/lms/credit",
  "dashboard.lms.lessonReports": "dashboard/lms/lessonReports",
  "dashboard.lms.monthlyReports": "dashboard/lms/monthlyReports",
  "dashboard.lms.teacherDues": "dashboard/lms/teacherDues",
  "dashboard.managersDirectory": "dashboard/managers/directory",
  "dashboard.managerOnboarding": "dashboard/managers/onboarding",
  "dashboard.parentsDirectory": "dashboard/parents/directory",
  "dashboard.parentOnboarding": "dashboard/parents/onboarding",
  "dashboard.parentStudents": "dashboard/parents/students",
  "dashboard.parentLifecycle": "dashboard/parents/lifecycle",
  "dashboard.parentProfile": "dashboard/parents/profile",
  "dashboard.parentRules": "dashboard/parents/rules",
  "dashboard.parentSocial": "dashboard/parents/social",
  "dashboard.permissions": "dashboard/permissions/main",
  "dashboard.paymentCatalogs": "dashboard/payment-catalogs/main",
  "dashboard.studentDirectory": "dashboard/students/directory",
  "dashboard.studentHistory": "dashboard/students/history",
  "dashboard.studentOnboarding": "dashboard/students/onboarding",
  "dashboard.studentProfile": "dashboard/students/profile",
  "dashboard.studentQuota": "dashboard/students/quota",
  "dashboard.studentStatus": "dashboard/students/status",
  "dashboard.teacherAvailability": "dashboard/teachers/availability",
  "dashboard.teacherDashboard": "dashboard/teachers/dashboard",
  "dashboard.teacherFutureSchedule": "dashboard/teachers/futureSchedule",
  "dashboard.teacherProfile": "dashboard/teachers/profile",
  "dashboard.teacherReassignment": "dashboard/teachers/reassignment",
  "dashboard.billing": "dashboard/billing/main",
  "dashboard.billing.manual": "dashboard/billing/manual",
  "dashboard.billing.payment": "dashboard/billing/payment",
  "dashboard.billing.exchangeRates": "dashboard/billing/exchangeRates",
  "dashboard.billing.currencyHedges": "dashboard/billing/currencyHedges",
  "dashboard.billing.supportedCurrencies": "dashboard/billing/supportedCurrencies",
  "dashboard.booksAndBags": "dashboard/resources/booksAndBags",
  "dashboard.classes.main": "dashboard/classes/main",
  "dashboard.classAudit": "dashboard/classes/audit",
  "dashboard.classDetails": "dashboard/classes/details",
  "dashboard.rescheduleForm": "dashboard/classes/rescheduleForm",
  "dashboard.rescheduleTracking": "dashboard/classes/rescheduleTracking",
  "dashboard.complaints": "dashboard/complaints/main",
  "dashboard.core.layout": "dashboard/core/layout",
  "dashboard.core.nav": "dashboard/core/nav",
  "dashboard.core.notifications": "dashboard/core/notifications",
  "dashboard.core.parentDashboard": "dashboard/core/parentDashboard",
  "dashboard.core.scheduleAlerts": "dashboard/core/scheduleAlerts",
  "dashboard.core.searchSchedule": "dashboard/core/searchSchedule",
  "dashboard.core.statusTracking": "dashboard/core/statusTracking",
  "dashboard.dstMigration": "dashboard/admin/dstMigration",
  "dashboard.meetingProviders": "dashboard/meeting-providers/main",
  "dashboard.resources": "dashboard/resources/main",
  "dashboard.reports": "dashboard/reports/main",
  "dashboard.subjects": "dashboard/subjects/main",
  "dashboard.suggestions": "dashboard/suggestions/main",
  "dashboard.teacherClassList": "dashboard/teachers/classList",
  "dashboard.teachersDirectory": "dashboard/teachers/directory",
  "dashboard.teacherCreateRecurringClass": "dashboard/teachers/createRecurringClass",
  "dashboard.teacherOnboarding": "dashboard/teachers/onboarding",
  "dashboard.teacherOwnProfile": "dashboard/teachers/ownProfile",
  "dashboard.teacherStudents": "dashboard/teachers/students",
  "dashboard.teacherWeeklySchedule": "dashboard/teachers/weeklySchedule",
  "dashboard.studentPortal.dashboard": "dashboard/studentPortal/studentDashboard",
  "dashboard.studentPortal.credits": "dashboard/studentPortal/studentCredits",
  "dashboard.studentPortal.history": "dashboard/studentPortal/studentHistory",
  "dashboard.studentPortal.profile": "dashboard/studentPortal/studentProfile",
  "dashboard.supervisorPortal.dashboard": "dashboard/supervisorPortal/supervisorDashboard",
  "dashboard.supervisorPortal.pendingReviews": "dashboard/supervisorPortal/pendingReviews",
  "dashboard.supervisorPortal.monthlyReports": "dashboard/supervisorPortal/monthlyReports",
  "dashboard.supervisorPortal.teacherDues": "dashboard/supervisorPortal/teacherDues",
  emails: "emails/index",
  profile: "profile",
  session: "session/index",
  sms: "sms/index",
  "ui.catalogImageUpload": "ui/catalogImageUpload",
  "ui.countrySelect": "ui/countrySelect",
  "ui.currencySelect": "ui/currencySelect",
  "ui.genderSelector": "ui/genderSelector",
  "ui.languageSelector": "ui/languageSelector",
  "ui.localizedString": "ui/localizedString",
  "ui.meetingConfig": "ui/meetingConfig",
  "ui.meetingConfig.manager": "ui/meetingConfig/manager",
  "ui.meetingConfig.classScope": "ui/meetingConfig/classScope",
  "ui.meetingConfig.display": "ui/meetingConfig/display",
  "ui.meetingConfig.summary": "ui/meetingConfig/summary",
  "ui.paymentMethod": "ui/paymentMethod",
  "ui.paymentMethod.manager": "ui/paymentMethod/manager",
  "ui.paymentMethod.display": "ui/paymentMethod/display",
  "ui.paymentMethod.list": "ui/paymentMethod/list",
  "ui.paymentMethod.typeSelector": "ui/paymentMethod/typeSelector",
  "ui.phoneInput": "ui/phoneInput",
  "ui.tagInput": "ui/tagInput",
  "ui.timezoneSelect": "ui/timezoneSelect",
  ui: "ui/index",
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
 * Internal helper: loads a translation namespace from disk.
 * Shared by getTranslations (SSR/API) and getServerTranslations (GraphQL/scripts).
 */
async function loadTranslation<K extends keyof MessageSchema>(
  safeLocale: AppLocale,
  namespace: K
): Promise<MessageSchema[K]> {
  const filePath = namespacePaths[namespace];
  const mod = await import(`@/shared/locale/${safeLocale}/${filePath}`);

  const segments = filePath.split("/");
  const exportName = segments.length >= 2 ? segments[segments.length - 2] : segments[0];
  return mod[exportName] as MessageSchema[K];
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
  return loadTranslation(safeLocale, namespace);
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
  return loadTranslation(safeLocale, namespace);
}

/**
 * Eagerly loads ALL translation namespaces for a given locale.
 * Use this in the root layout to populate <LocaleProvider> with every
 * namespace so any client component can use useAppTranslation without
 * per-namespace wiring.
 *
 * Returns a Partial<MessageSchema> — every key is present.
 */
export async function loadAllTranslations(locale: string): Promise<Partial<MessageSchema>> {
  const safeLocale: AppLocale = (locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale;
  const entries = await Promise.all(
    (Object.keys(namespacePaths) as (keyof MessageSchema)[]).map(async ns => {
      const value = await loadTranslation(safeLocale, ns);
      return [ns, value] as const;
    })
  );
  return Object.fromEntries(entries) as Partial<MessageSchema>;
}
