import { AuthGroupSimulation } from "@/shared/locale/namespaces/auth/groupSimulation.namespace";
import { AuthImpersonation } from "@/shared/locale/namespaces/auth/impersonation.namespace";
import { AuthLogin } from "@/shared/locale/namespaces/auth/login.namespace";
import { Common } from "@/shared/locale/namespaces/common/common.namespace";
import { DashboardAdminDstMigration } from "@/shared/locale/namespaces/dashboard/admin/dstMigration.namespace";
import { DashboardAdmin } from "@/shared/locale/namespaces/dashboard/admin/main.namespace";
import { DashboardAdminView } from "@/shared/locale/namespaces/dashboard/admin/view.namespace";
import { DashboardBillingCurrencyHedges } from "@/shared/locale/namespaces/dashboard/billing/currencyHedges.namespace";
import { DashboardBillingExchangeRates } from "@/shared/locale/namespaces/dashboard/billing/exchangeRates.namespace";
import { DashboardBilling } from "@/shared/locale/namespaces/dashboard/billing/main.namespace";
import { DashboardBillingManual } from "@/shared/locale/namespaces/dashboard/billing/manual.namespace";
import { DashboardBillingQuota } from "@/shared/locale/namespaces/dashboard/billing/quota.namespace";
import { DashboardBillingSupportedCurrencies } from "@/shared/locale/namespaces/dashboard/billing/supportedCurrencies.namespace";

import { DashboardClassAudit } from "@/shared/locale/namespaces/dashboard/classes/audit.namespace";
import { DashboardCreateRecurringClass } from "@/shared/locale/namespaces/dashboard/classes/createRecurringClass.namespace";
import { DashboardClassDetails } from "@/shared/locale/namespaces/dashboard/classes/details.namespace";
import { DashboardClassesMain } from "@/shared/locale/namespaces/dashboard/classes/main.namespace";
import { DashboardRecurringSchedulesList } from "@/shared/locale/namespaces/dashboard/classes/recurringSchedulesList.namespace";
import { DashboardRescheduleForm } from "@/shared/locale/namespaces/dashboard/classes/rescheduleForm.namespace";
import { DashboardRescheduleTracking } from "@/shared/locale/namespaces/dashboard/classes/rescheduleTracking.namespace";
import { DashboardComplaints } from "@/shared/locale/namespaces/dashboard/complaints/main.namespace";
import { DashboardCoreLayout } from "@/shared/locale/namespaces/dashboard/core/layout.namespace";
import { DashboardCoreNav } from "@/shared/locale/namespaces/dashboard/core/nav.namespace";
import { DashboardCoreNotifications } from "@/shared/locale/namespaces/dashboard/core/notifications.namespace";
import { DashboardCoreParentDashboard } from "@/shared/locale/namespaces/dashboard/core/parentDashboard.namespace";
import { DashboardCoreScheduleAlerts } from "@/shared/locale/namespaces/dashboard/core/scheduleAlerts.namespace";
import { DashboardCoreSearchSchedule } from "@/shared/locale/namespaces/dashboard/core/searchSchedule.namespace";
import { DashboardCoreStatusTracking } from "@/shared/locale/namespaces/dashboard/core/statusTracking.namespace";
import { DashboardCron } from "@/shared/locale/namespaces/dashboard/cron/main.namespace";
import { DashboardFeedbackManageParent } from "@/shared/locale/namespaces/dashboard/feedback/main.namespace";
import { DashboardLmsCredit } from "@/shared/locale/namespaces/dashboard/lms/credit.namespace";
import { DashboardLmsLessonReports } from "@/shared/locale/namespaces/dashboard/lms/lessonReports.namespace";
import { DashboardLmsMonthlyReports } from "@/shared/locale/namespaces/dashboard/lms/monthlyReports.namespace";
import { DashboardLmsTeacherDues } from "@/shared/locale/namespaces/dashboard/lms/teacherDues.namespace";
import { DashboardMeetingProviders } from "@/shared/locale/namespaces/dashboard/meeting-providers/main.namespace";
import { DashboardParentsDirectory } from "@/shared/locale/namespaces/dashboard/parents/directory.namespace";
import { DashboardParentLifecycle } from "@/shared/locale/namespaces/dashboard/parents/lifecycle.namespace";
import { DashboardParentOnboarding } from "@/shared/locale/namespaces/dashboard/parents/onboarding.namespace";
import { DashboardParentProfile } from "@/shared/locale/namespaces/dashboard/parents/profile.namespace";
import { DashboardParentRules } from "@/shared/locale/namespaces/dashboard/parents/rules.namespace";
import { DashboardParentSocial } from "@/shared/locale/namespaces/dashboard/parents/social.namespace";
import { DashboardParentStudents } from "@/shared/locale/namespaces/dashboard/parents/students.namespace";
import { DashboardPaymentCatalogs } from "@/shared/locale/namespaces/dashboard/payment-catalogs/main.namespace";
import { DashboardPaymentCatalogsParent } from "@/shared/locale/namespaces/dashboard/payment-catalogs/parent.namespace";
import { DashboardPermissions } from "@/shared/locale/namespaces/dashboard/permissions/main.namespace";
import { DashboardReports } from "@/shared/locale/namespaces/dashboard/reports/main.namespace";
import { DashboardBooksAndBags } from "@/shared/locale/namespaces/dashboard/resources/booksAndBags.namespace";
import { DashboardResources } from "@/shared/locale/namespaces/dashboard/resources/main.namespace";
import { DashboardScheduleTrackingParent } from "@/shared/locale/namespaces/dashboard/schedule-tracking/main.namespace";
import { DashboardSettingsEnvironment } from "@/shared/locale/namespaces/dashboard/settings/environment.namespace";
import { DashboardSettingsGeneral } from "@/shared/locale/namespaces/dashboard/settings/general.namespace";
import { DashboardSettings } from "@/shared/locale/namespaces/dashboard/settings/main.namespace";
import { DashboardSettingsMeetingIntegrations } from "@/shared/locale/namespaces/dashboard/settings/meetingIntegrations.namespace";
import { DashboardSettingsSession } from "@/shared/locale/namespaces/dashboard/settings/session.namespace";
import { DashboardSettingsSiteContent } from "@/shared/locale/namespaces/dashboard/settings/siteContent.namespace";
import { DashboardSettingsTimezones } from "@/shared/locale/namespaces/dashboard/settings/timezones.namespace";
import { DashboardStaffDirectory } from "@/shared/locale/namespaces/dashboard/staff/directory.namespace";
import { DashboardStaffOnboarding } from "@/shared/locale/namespaces/dashboard/staff/onboarding.namespace";
import { DashboardStudentPortalCredits } from "@/shared/locale/namespaces/dashboard/studentPortal/credits.namespace";
import { DashboardStudentPortalDashboard } from "@/shared/locale/namespaces/dashboard/studentPortal/dashboard.namespace";
import { DashboardStudentPortalHistory } from "@/shared/locale/namespaces/dashboard/studentPortal/history.namespace";
import { DashboardStudentPortalProfile } from "@/shared/locale/namespaces/dashboard/studentPortal/profile.namespace";
import { DashboardStudentPortalSessions } from "@/shared/locale/namespaces/dashboard/studentPortal/sessions.namespace";
import { DashboardStudentDirectory } from "@/shared/locale/namespaces/dashboard/students/directory.namespace";
import { DashboardStudentHistory } from "@/shared/locale/namespaces/dashboard/students/history.namespace";
import { DashboardStudentOnboarding } from "@/shared/locale/namespaces/dashboard/students/onboarding.namespace";
import { DashboardStudentProfile } from "@/shared/locale/namespaces/dashboard/students/profile.namespace";
import { DashboardStudentQuota } from "@/shared/locale/namespaces/dashboard/students/quota.namespace";
import { DashboardStudentStatus } from "@/shared/locale/namespaces/dashboard/students/status.namespace";
import { DashboardSubjects } from "@/shared/locale/namespaces/dashboard/subjects/main.namespace";
import { DashboardSuggestions } from "@/shared/locale/namespaces/dashboard/suggestions/main.namespace";
import { DashboardSupervisorPortalDashboard } from "@/shared/locale/namespaces/dashboard/supervisorPortal/dashboard.namespace";
import { DashboardSupervisorPortalMonthlyReports } from "@/shared/locale/namespaces/dashboard/supervisorPortal/monthlyReports.namespace";
import { DashboardSupervisorPortalPendingReviews } from "@/shared/locale/namespaces/dashboard/supervisorPortal/pendingReviews.namespace";
import { DashboardSupervisorPortalProfile } from "@/shared/locale/namespaces/dashboard/supervisorPortal/profile.namespace";
import { DashboardSupervisorPortalTeacherDues } from "@/shared/locale/namespaces/dashboard/supervisorPortal/teacherDues.namespace";
import { DashboardTeacherAvailability } from "@/shared/locale/namespaces/dashboard/teachers/availability.namespace";
import { DashboardTeacherClassList } from "@/shared/locale/namespaces/dashboard/teachers/classList.namespace";
import { DashboardTeacherCreateRecurringClass } from "@/shared/locale/namespaces/dashboard/teachers/createRecurringClass.namespace";
import { DashboardTeacherDashboard } from "@/shared/locale/namespaces/dashboard/teachers/dashboard.namespace";
import { DashboardTeachersDirectory } from "@/shared/locale/namespaces/dashboard/teachers/directory.namespace";
import { DashboardTeacherFutureSchedule } from "@/shared/locale/namespaces/dashboard/teachers/futureSchedule.namespace";
import { DashboardTeacherOnboarding } from "@/shared/locale/namespaces/dashboard/teachers/onboarding.namespace";
import { DashboardTeacherOwnProfile } from "@/shared/locale/namespaces/dashboard/teachers/ownProfile.namespace";
import { DashboardTeacherProfile } from "@/shared/locale/namespaces/dashboard/teachers/profile.namespace";
import { DashboardTeacherReassignment } from "@/shared/locale/namespaces/dashboard/teachers/reassignment.namespace";
import { DashboardTeacherStudents } from "@/shared/locale/namespaces/dashboard/teachers/students.namespace";
import { DashboardTeacherWeeklySchedule } from "@/shared/locale/namespaces/dashboard/teachers/weeklySchedule.namespace";
import { DashboardUsersCreateUser } from "@/shared/locale/namespaces/dashboard/users/createUser.namespace";
import { DashboardUsersDirectoryParent } from "@/shared/locale/namespaces/dashboard/users/directory.namespace";
import { Emails } from "@/shared/locale/namespaces/emails/emails.namespace";
import { Errors } from "@/shared/locale/namespaces/errors/errors.namespace";
import { Notifications } from "@/shared/locale/namespaces/notifications/notifications.namespace";
import { OnboardingUserEntity } from "@/shared/locale/namespaces/onboarding/userEntity.namespace";
import { ProfileBase } from "@/shared/locale/namespaces/profile/base.namespace";
import { ProfileNotifications } from "@/shared/locale/namespaces/profile/notifications.namespace";
import { ProfileParent } from "@/shared/locale/namespaces/profile/parent.namespace";
import { ProfileStaff } from "@/shared/locale/namespaces/profile/staff.namespace";
import { ProfileTeacher } from "@/shared/locale/namespaces/profile/teacher.namespace";
import { Session } from "@/shared/locale/namespaces/session/session.namespace";
import { Sms } from "@/shared/locale/namespaces/sms/sms.namespace";
import { UiCatalogImageUpload } from "@/shared/locale/namespaces/ui/catalogImageUpload.namespace";
import { UiCountrySelect } from "@/shared/locale/namespaces/ui/countrySelect.namespace";
import { UiCurrencySelect } from "@/shared/locale/namespaces/ui/currencySelect.namespace";
import { UiEditableTypography } from "@/shared/locale/namespaces/ui/editableTypography.namespace";
import { UiGenderSelector } from "@/shared/locale/namespaces/ui/genderSelector.namespace";
import { UiLanguageSelector } from "@/shared/locale/namespaces/ui/languageSelector.namespace";
import { UiLocalizedString } from "@/shared/locale/namespaces/ui/localizedString.namespace";
import { UiMeetingConfig } from "@/shared/locale/namespaces/ui/meetingConfig.namespace";
import { UiMeetingConfigRecurringSchedule } from "@/shared/locale/namespaces/ui/meetingConfigRecurringSchedule.namespace";
import { UiPaymentMethod } from "@/shared/locale/namespaces/ui/paymentMethod.namespace";
import { UiPhoneInput } from "@/shared/locale/namespaces/ui/phoneInput.namespace";
import { UiTagInput } from "@/shared/locale/namespaces/ui/tagInput.namespace";
import { UiTimezoneSelect } from "@/shared/locale/namespaces/ui/timezoneSelect.namespace";
import { UiUserSelect } from "@/shared/locale/namespaces/ui/userSelect.namespace";
import { Whatsapp } from "@/shared/locale/namespaces/whatsapp/whatsapp.namespace";
export const Translation = {
  Auth: {
    Login: AuthLogin,
    Impersonation: AuthImpersonation,
    GroupSimulation: AuthGroupSimulation,
  },
  Common,
  Errors,
  Emails,
  Session,
  Sms,
  Notifications,
  Whatsapp,
  Onboarding: {
    UserEntity: OnboardingUserEntity,
  },
  Profile: {
    Base: ProfileBase,
    Teacher: ProfileTeacher,
    Parent: ProfileParent,
    Staff: ProfileStaff,
    Notifications: ProfileNotifications,
  },
  Dashboard: {
    Admin: DashboardAdmin,
    AdminView: DashboardAdminView,
    AdminDstMigration: DashboardAdminDstMigration,
    Billing: DashboardBilling,
    BillingManual: DashboardBillingManual,
    BillingQuota: DashboardBillingQuota,
    BillingCurrencyHedges: DashboardBillingCurrencyHedges,

    BillingSupportedCurrencies: DashboardBillingSupportedCurrencies,
    BillingExchangeRates: DashboardBillingExchangeRates,
    BooksAndBags: DashboardBooksAndBags,
    ClassAudit: DashboardClassAudit,
    ClassDetails: DashboardClassDetails,
    ClassesMain: DashboardClassesMain,
    Complaints: DashboardComplaints,
    CoreNav: DashboardCoreNav,
    CoreLayout: DashboardCoreLayout,
    CoreNotifications: DashboardCoreNotifications,
    CoreSearchSchedule: DashboardCoreSearchSchedule,
    CoreStatusTracking: DashboardCoreStatusTracking,
    CoreScheduleAlerts: DashboardCoreScheduleAlerts,
    CoreParentDashboard: DashboardCoreParentDashboard,
    Cron: DashboardCron,
    CreateRecurringClass: DashboardCreateRecurringClass,
    RecurringSchedulesList: DashboardRecurringSchedulesList,
    FeedbackManageParent: DashboardFeedbackManageParent,
    LmsCredit: DashboardLmsCredit,
    LmsLessonReports: DashboardLmsLessonReports,
    LmsMonthlyReports: DashboardLmsMonthlyReports,
    LmsTeacherDues: DashboardLmsTeacherDues,
    MeetingProviders: DashboardMeetingProviders,
    ParentLifecycle: DashboardParentLifecycle,
    ParentOnboarding: DashboardParentOnboarding,
    ParentProfile: DashboardParentProfile,
    ParentRules: DashboardParentRules,
    ParentSocial: DashboardParentSocial,
    ParentStudents: DashboardParentStudents,
    ParentsDirectory: DashboardParentsDirectory,
    UsersDirectoryParent: DashboardUsersDirectoryParent,
    UsersCreateUser: DashboardUsersCreateUser,
    PaymentCatalogs: DashboardPaymentCatalogs,
    PaymentCatalogsParent: DashboardPaymentCatalogsParent,
    Permissions: DashboardPermissions,
    Reports: DashboardReports,
    RescheduleForm: DashboardRescheduleForm,
    RescheduleTracking: DashboardRescheduleTracking,
    Resources: DashboardResources,
    ScheduleTrackingParent: DashboardScheduleTrackingParent,
    Settings: DashboardSettings,
    SettingsEnvironment: DashboardSettingsEnvironment,
    SettingsGeneral: DashboardSettingsGeneral,
    SettingsMeetingIntegrations: DashboardSettingsMeetingIntegrations,
    SettingsSession: DashboardSettingsSession,
    SettingsSiteContent: DashboardSettingsSiteContent,
    SettingsTimezones: DashboardSettingsTimezones,
    StaffDirectory: DashboardStaffDirectory,
    StaffOnboarding: DashboardStaffOnboarding,
    StudentDirectory: DashboardStudentDirectory,
    StudentHistory: DashboardStudentHistory,
    StudentOnboarding: DashboardStudentOnboarding,
    StudentPortalCredits: DashboardStudentPortalCredits,
    StudentPortalDashboard: DashboardStudentPortalDashboard,
    StudentPortalHistory: DashboardStudentPortalHistory,
    StudentPortalSessions: DashboardStudentPortalSessions,
    StudentPortalProfile: DashboardStudentPortalProfile,
    StudentProfile: DashboardStudentProfile,
    StudentQuota: DashboardStudentQuota,
    StudentStatus: DashboardStudentStatus,
    Subjects: DashboardSubjects,
    Suggestions: DashboardSuggestions,
    SupervisorPortalDashboard: DashboardSupervisorPortalDashboard,
    SupervisorPortalMonthlyReports: DashboardSupervisorPortalMonthlyReports,
    SupervisorPortalPendingReviews: DashboardSupervisorPortalPendingReviews,
    SupervisorPortalProfile: DashboardSupervisorPortalProfile,
    SupervisorPortalTeacherDues: DashboardSupervisorPortalTeacherDues,
    TeacherAvailability: DashboardTeacherAvailability,
    TeacherClassList: DashboardTeacherClassList,
    TeacherCreateRecurringClass: DashboardTeacherCreateRecurringClass,
    TeacherDashboard: DashboardTeacherDashboard,
    TeacherFutureSchedule: DashboardTeacherFutureSchedule,
    TeacherOnboarding: DashboardTeacherOnboarding,
    TeacherOwnProfile: DashboardTeacherOwnProfile,
    TeacherProfile: DashboardTeacherProfile,
    TeacherReassignment: DashboardTeacherReassignment,
    TeacherStudents: DashboardTeacherStudents,
    TeacherWeeklySchedule: DashboardTeacherWeeklySchedule,
    TeachersDirectory: DashboardTeachersDirectory,
  },
  Ui: {
    CatalogImageUpload: UiCatalogImageUpload,
    EditableTypography: UiEditableTypography,
    CountrySelect: UiCountrySelect,
    CurrencySelect: UiCurrencySelect,
    GenderSelector: UiGenderSelector,
    LanguageSelector: UiLanguageSelector,
    LocalizedString: UiLocalizedString,
    PhoneInput: UiPhoneInput,
    TagInput: UiTagInput,
    TimezoneSelect: UiTimezoneSelect,
    MeetingConfig: UiMeetingConfig,
    MeetingConfigRecurringSchedule: UiMeetingConfigRecurringSchedule,
    PaymentMethod: UiPaymentMethod,
    UserSelect: UiUserSelect,
  },
} as const;
