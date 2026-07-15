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
    "dashboard.createRecurringClass": "dashboard/classes/createRecurringClass",
    emails: "emails/index",
    profile: "profile",
    "profile.teacher": "profile/teacher",
    "profile.parent": "profile/parent",
    "profile.staff": "profile/staff",
    "profile.notifications": "profile/notifications",
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
    "ui.meetingConfig.fields": "ui/meetingConfig/fields",
    "ui.meetingConfig.join": "ui/meetingConfig/join",
    "ui.meetingConfig.providerSelect": "ui/meetingConfig/providerSelect",
    "ui.meetingConfig.recurringSchedule": "ui/meetingConfig/recurringSchedule",
    "ui.paymentMethod": "ui/paymentMethod",
    "ui.paymentMethod.manager": "ui/paymentMethod/manager",
    "ui.paymentMethod.display": "ui/paymentMethod/display",
    "ui.paymentMethod.list": "ui/paymentMethod/list",
    "ui.paymentMethod.typeSelector": "ui/paymentMethod/typeSelector",
    "ui.paymentMethod.typeFields": "ui/paymentMethod/typeFields",
    "ui.paymentMethod.defaultsEditor": "ui/paymentMethod/defaultsEditor",
    "ui.paymentMethod.type": "ui/paymentMethod/type",
    "ui.paymentMethod.direction": "ui/paymentMethod/direction",
    "ui.paymentMethod.identifier": "ui/paymentMethod/identifier",
    "ui.paymentMethod.select": "ui/paymentMethod/select",
    "ui.phoneInput": "ui/phoneInput",
    "ui.tagInput": "ui/tagInput",
    "ui.timezoneSelect": "ui/timezoneSelect",
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
