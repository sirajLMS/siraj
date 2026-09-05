/**
 * Preload all meeting-related translation namespaces so that `useAppTranslation`
 * in components finds cached values immediately (no Suspense fallback = empty body).
 *
 * The translation system uses React Suspense: `readTranslation` throws a promise
 * for lazy-loaded namespaces that haven't resolved yet. If a test renders before
 * the promise resolves, the component shows the Suspense fallback (null = empty body).
 *
 * This preload starts all namespace loads and awaits their resolution at module
 * level, so by the time any test runs, `readTranslation` returns cached values
 * synchronously.
 */
import { locales } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import {
  DashboardAccountingPackagePlans,
  DashboardAccountingPayments,
  DashboardAccountingStudentCreditHours,
} from "@/shared/locale/namespaces/dashboard/accounting";
import { DashboardBillingPayroll } from "@/shared/locale/namespaces/dashboard/billing";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";
import { Translation } from "@/shared/locale/namespaces/translation";

const meetingNamespaceHandles: readonly NamespaceHandle<unknown>[] = [
  DashboardAccountingPackagePlans,
  DashboardAccountingPayments,
  DashboardAccountingStudentCreditHours,
  DashboardBillingPayroll,
  Translation.Common,
  Translation.Whatsapp,
  Translation.Dashboard.Cron,
  Translation.Dashboard.ClassAudit,
  Translation.Dashboard.CreateRecurringClass,
  Translation.Dashboard.ClassDetails,
  Translation.Session,
  Translation.Dashboard.LmsLessonReports,
  Translation.Dashboard.MeetingGeneration,
  Translation.Dashboard.MeetingProviders,
  Translation.Dashboard.PaymentCatalogs,
  Translation.Dashboard.PaymentCatalogsParent,
  Translation.Dashboard.MeetingUrlStatus,
  Translation.Dashboard.OAuthFlow,
  Translation.Dashboard.BillingQuota,
  Translation.Dashboard.Settings,
  Translation.Dashboard.SettingsGeneral,
  Translation.Dashboard.SettingsMeetingIntegrations,
  Translation.Dashboard.SettingsSession,
  Translation.Dashboard.SettingsSiteContent,
  Translation.Dashboard.SettingsTimezones,
  Translation.Dashboard.StudentPortalCredits,
  Translation.Dashboard.StudentPortalDashboard,
  Translation.Dashboard.StudentPortalHistory,
  Translation.Dashboard.StudentPortalProfile,
  Translation.Dashboard.StudentPortalSessions,
  Translation.Dashboard.StudentQuota,
  Translation.Dashboard.SupervisorPortalPendingReviews,
  Translation.Dashboard.Admin,
  Translation.Dashboard.AdminView,
  Translation.Dashboard.RecurringSchedulesList,
  Translation.Dashboard.SessionAudit,
  Translation.Dashboard.CoreSearchSchedule,
  Translation.Dashboard.StudentHistory,
  Translation.Dashboard.TeacherDashboard,
  Translation.Dashboard.TeacherCreateRecurringClass,
  Translation.Dashboard.TeacherFutureSchedule,
  Translation.Dashboard.TeacherProfile,
  Translation.Dashboard.TeacherOwnProfile,
  Translation.Dashboard.Billing,
  Translation.Profile.Base,
  Translation.Profile.Notifications,
  Translation.Ui.MeetingConfig,
  Translation.Ui.MeetingConfigRecurringSchedule,
  Translation.Ui.PaymentMethod,
  Translation.Ui.RichText,
  Translation.Dashboard.CoreNotifications,
  Translation.Dashboard.CoreNav,
  Translation.Dashboard.CoreStatusTracking,
  Translation.Dashboard.RescheduleTracking,
  Translation.Dashboard.ParentsDirectory,
  Translation.Dashboard.StudentStatus,
  Translation.Dashboard.SupervisorPortalProfile,
  Translation.Errors,
  Translation.Profile.Parent,
  Translation.Profile.Staff,
  Translation.Profile.Teacher,
  Translation.Ui.UserSelect,
  Translation.Ui.TagInput,
  Translation.Ui.TimezoneSelect,
];

const pendingPromises: Promise<unknown>[] = [];

for (const handle of meetingNamespaceHandles) {
  for (const locale of locales) {
    try {
      readTranslation(handle, locale);
    } catch (thrown) {
      if (thrown instanceof Promise) {
        pendingPromises.push(thrown);
      }
    }
  }
}

await Promise.all(pendingPromises);
