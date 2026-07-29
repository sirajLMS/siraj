/** Canonical static leaf assembler for server getTranslations (Phase 4). Same leaf modules as defineNamespace loaders. */
import { authEn } from "@/shared/locale/en/auth";
import { commonEn } from "@/shared/locale/en/common";
import { dashboardAdminEn } from "@/shared/locale/en/dashboard/admin";
import { dashboardDstMigrationEn } from "@/shared/locale/en/dashboard/admin/dstMigration.ts";
import { dashboardAdminViewEn } from "@/shared/locale/en/dashboard/admin/view.ts";
import { dashboardBillingCurrencyHedgesEn } from "@/shared/locale/en/dashboard/billing/currencyHedges.ts";
import { dashboardBillingExchangeRatesEn } from "@/shared/locale/en/dashboard/billing/exchangeRates.ts";
import { dashboardBillingEn } from "@/shared/locale/en/dashboard/billing/main.ts";
import { dashboardBillingManualEn } from "@/shared/locale/en/dashboard/billing/manual.ts";
import { dashboardBillingPaymentEn } from "@/shared/locale/en/dashboard/billing/payment.ts";
import { dashboardBillingSupportedCurrenciesEn } from "@/shared/locale/en/dashboard/billing/supportedCurrencies.ts";
import { dashboardClassAuditEn } from "@/shared/locale/en/dashboard/classes/audit.ts";
import { dashboardCreateRecurringClassEn } from "@/shared/locale/en/dashboard/classes/createRecurringClass.ts";
import { dashboardClassDetailsEn } from "@/shared/locale/en/dashboard/classes/details.ts";
import { dashboardClassesMainEn } from "@/shared/locale/en/dashboard/classes/main.ts";
import { dashboardRescheduleFormEn } from "@/shared/locale/en/dashboard/classes/rescheduleForm.ts";
import { dashboardRescheduleTrackingEn } from "@/shared/locale/en/dashboard/classes/rescheduleTracking.ts";
import { dashboardComplaintsEn } from "@/shared/locale/en/dashboard/complaints/main.ts";
import { dashboardCoreLayoutEn } from "@/shared/locale/en/dashboard/core/layout.ts";
import { dashboardCoreNavEn } from "@/shared/locale/en/dashboard/core/nav.ts";
import { dashboardCoreNotificationsEn } from "@/shared/locale/en/dashboard/core/notifications.ts";
import { dashboardCoreParentDashboardEn } from "@/shared/locale/en/dashboard/core/parentDashboard.ts";
import { dashboardCoreScheduleAlertsEn } from "@/shared/locale/en/dashboard/core/scheduleAlerts.ts";
import { dashboardCoreSearchScheduleEn } from "@/shared/locale/en/dashboard/core/searchSchedule.ts";
import { dashboardCoreStatusTrackingEn } from "@/shared/locale/en/dashboard/core/statusTracking.ts";
import { dashboardFeedbackManageParentEn } from "@/shared/locale/en/dashboard/feedback/main.ts";
import { dashboardLmsCreditEn } from "@/shared/locale/en/dashboard/lms/credit.ts";
import { dashboardLmsLessonReportsEn } from "@/shared/locale/en/dashboard/lms/lessonReports.ts";
import { dashboardLmsMonthlyReportsEn } from "@/shared/locale/en/dashboard/lms/monthlyReports.ts";
import { dashboardLmsTeacherDuesEn } from "@/shared/locale/en/dashboard/lms/teacherDues.ts";
import { dashboardMeetingProvidersEn } from "@/shared/locale/en/dashboard/meeting-providers/main.ts";
import { dashboardParentsDirectoryEn } from "@/shared/locale/en/dashboard/parents/directory.ts";
import { dashboardParentLifecycleEn } from "@/shared/locale/en/dashboard/parents/lifecycle.ts";
import { dashboardParentOnboardingEn } from "@/shared/locale/en/dashboard/parents/onboarding.ts";
import { dashboardParentProfileEn } from "@/shared/locale/en/dashboard/parents/profile.ts";
import { dashboardParentRulesEn } from "@/shared/locale/en/dashboard/parents/rules.ts";
import { dashboardParentSocialEn } from "@/shared/locale/en/dashboard/parents/social.ts";
import { dashboardParentStudentsEn } from "@/shared/locale/en/dashboard/parents/students.ts";
import { dashboardPaymentCatalogsEn } from "@/shared/locale/en/dashboard/payment-catalogs/main.ts";
import { dashboardPaymentCatalogsParentEn } from "@/shared/locale/en/dashboard/payment-catalogs/parent.ts";
import { dashboardPermissionsEn } from "@/shared/locale/en/dashboard/permissions/main.ts";
import { dashboardReportsEn } from "@/shared/locale/en/dashboard/reports/main.ts";
import { dashboardBooksAndBagsEn } from "@/shared/locale/en/dashboard/resources/booksAndBags.ts";
import { dashboardResourcesEn } from "@/shared/locale/en/dashboard/resources/main.ts";
import { dashboardScheduleTrackingParentEn } from "@/shared/locale/en/dashboard/schedule-tracking/main.ts";
import { dashboardSettingsEn } from "@/shared/locale/en/dashboard/settings/main.ts";
import { dashboardStaffDirectoryEn } from "@/shared/locale/en/dashboard/staff/directory.ts";
import { dashboardStaffOnboardingEn } from "@/shared/locale/en/dashboard/staff/onboarding.ts";
import { dashboardStudentPortalCreditsEn } from "@/shared/locale/en/dashboard/studentPortal/studentCredits.ts";
import { dashboardStudentPortalDashboardEn } from "@/shared/locale/en/dashboard/studentPortal/studentDashboard.ts";
import { dashboardStudentPortalHistoryEn } from "@/shared/locale/en/dashboard/studentPortal/studentHistory.ts";
import { dashboardStudentPortalProfileEn } from "@/shared/locale/en/dashboard/studentPortal/studentProfile.ts";
import { dashboardStudentDirectoryEn } from "@/shared/locale/en/dashboard/students/directory.ts";
import { dashboardStudentHistoryEn } from "@/shared/locale/en/dashboard/students/history.ts";
import { dashboardStudentOnboardingEn } from "@/shared/locale/en/dashboard/students/onboarding.ts";
import { dashboardStudentProfileEn } from "@/shared/locale/en/dashboard/students/profile.ts";
import { dashboardStudentQuotaEn } from "@/shared/locale/en/dashboard/students/quota.ts";
import { dashboardStudentStatusEn } from "@/shared/locale/en/dashboard/students/status.ts";
import { dashboardSubjectsEn } from "@/shared/locale/en/dashboard/subjects/main.ts";
import { dashboardSuggestionsEn } from "@/shared/locale/en/dashboard/suggestions/main.ts";
import { dashboardSupervisorPortalMonthlyReportsEn } from "@/shared/locale/en/dashboard/supervisorPortal/monthlyReports.ts";
import { dashboardSupervisorPortalPendingReviewsEn } from "@/shared/locale/en/dashboard/supervisorPortal/pendingReviews.ts";
import { dashboardSupervisorPortalProfileEn } from "@/shared/locale/en/dashboard/supervisorPortal/profile.ts";
import { dashboardSupervisorPortalDashboardEn } from "@/shared/locale/en/dashboard/supervisorPortal/supervisorDashboard.ts";
import { dashboardSupervisorPortalTeacherDuesEn } from "@/shared/locale/en/dashboard/supervisorPortal/teacherDues.ts";
import { dashboardTeacherAvailabilityEn } from "@/shared/locale/en/dashboard/teachers/availability.ts";
import { dashboardTeacherClassListEn } from "@/shared/locale/en/dashboard/teachers/classList.ts";
import { dashboardTeacherCreateRecurringClassEn } from "@/shared/locale/en/dashboard/teachers/createRecurringClass.ts";
import { dashboardTeacherDashboardEn } from "@/shared/locale/en/dashboard/teachers/dashboard.ts";
import { dashboardTeachersDirectoryEn } from "@/shared/locale/en/dashboard/teachers/directory.ts";
import { dashboardTeacherFutureScheduleEn } from "@/shared/locale/en/dashboard/teachers/futureSchedule.ts";
import { dashboardTeacherOnboardingEn } from "@/shared/locale/en/dashboard/teachers/onboarding.ts";
import { dashboardTeacherOwnProfileEn } from "@/shared/locale/en/dashboard/teachers/ownProfile.ts";
import { dashboardTeacherProfileEn } from "@/shared/locale/en/dashboard/teachers/profile.ts";
import { dashboardTeacherReassignmentEn } from "@/shared/locale/en/dashboard/teachers/reassignment.ts";
import { dashboardTeacherStudentsEn } from "@/shared/locale/en/dashboard/teachers/students.ts";
import { dashboardTeacherWeeklyScheduleEn } from "@/shared/locale/en/dashboard/teachers/weeklySchedule.ts";
import { dashboardUsersDirectoryParentEn } from "@/shared/locale/en/dashboard/users/directory.ts";
import { emailsEn } from "@/shared/locale/en/emails";
import { errorsEn } from "@/shared/locale/en/errors";
import { notificationsEn } from "@/shared/locale/en/notifications";
import { profileNotificationsEn } from "@/shared/locale/en/profile/notifications";
import { profileParentEn } from "@/shared/locale/en/profile/parent";
import { profileStaffEn } from "@/shared/locale/en/profile/staff";
import { profileTeacherEn } from "@/shared/locale/en/profile/teacher";
import { profileEn } from "@/shared/locale/en/profile.ts";
import { sessionEn } from "@/shared/locale/en/session";
import { smsEn } from "@/shared/locale/en/sms";
import { uiCatalogImageUploadEn } from "@/shared/locale/en/ui/catalog-image-upload.ts";
import { uiCountrySelectEn } from "@/shared/locale/en/ui/country-select.ts";
import { uiCurrencySelectEn } from "@/shared/locale/en/ui/currency-select.ts";
import { uiGenderSelectorEn } from "@/shared/locale/en/ui/gender-selector.ts";
import { uiLanguageSelectorEn } from "@/shared/locale/en/ui/language-selector.ts";
import { uiLocalizedStringEn } from "@/shared/locale/en/ui/localized-string.ts";
import { uiMeetingConfigEn } from "@/shared/locale/en/ui/meeting-config.ts";
import { uiMeetingConfigClassScopeEn } from "@/shared/locale/en/ui/meetingConfig/classScope.ts";
import { uiMeetingConfigDisplayEn } from "@/shared/locale/en/ui/meetingConfig/display.ts";
import { uiMeetingConfigFieldsEn } from "@/shared/locale/en/ui/meetingConfig/fields.ts";
import { uiMeetingConfigJoinEn } from "@/shared/locale/en/ui/meetingConfig/join.ts";
import { uiMeetingConfigManagerEn } from "@/shared/locale/en/ui/meetingConfig/manager.ts";
import { uiMeetingConfigProviderSelectEn } from "@/shared/locale/en/ui/meetingConfig/providerSelect.ts";
import { uiMeetingConfigRecurringScheduleEn } from "@/shared/locale/en/ui/meetingConfig/recurringSchedule.ts";
import { uiMeetingConfigSummaryEn } from "@/shared/locale/en/ui/meetingConfig/summary.ts";
import { uiPaymentMethodEn } from "@/shared/locale/en/ui/payment-method.ts";
import { uiPaymentMethodDefaultsEditorEn } from "@/shared/locale/en/ui/paymentMethod/defaultsEditor.ts";
import { uiPaymentMethodDirectionEn } from "@/shared/locale/en/ui/paymentMethod/direction.ts";
import { uiPaymentMethodDisplayEn } from "@/shared/locale/en/ui/paymentMethod/display.ts";
import { uiPaymentMethodIdentifierEn } from "@/shared/locale/en/ui/paymentMethod/identifier.ts";
import { uiPaymentMethodListEn } from "@/shared/locale/en/ui/paymentMethod/list.ts";
import { uiPaymentMethodManagerEn } from "@/shared/locale/en/ui/paymentMethod/manager.ts";
import { uiPaymentMethodSelectEn } from "@/shared/locale/en/ui/paymentMethod/select.ts";
import { uiPaymentMethodTypeEn } from "@/shared/locale/en/ui/paymentMethod/type.ts";
import { uiPaymentMethodTypeFieldsEn } from "@/shared/locale/en/ui/paymentMethod/typeFields.ts";
import { uiPaymentMethodTypeSelectorEn } from "@/shared/locale/en/ui/paymentMethod/typeSelector.ts";
import { uiPhoneInputEn } from "@/shared/locale/en/ui/phone-input.ts";
import { uiTagInputEn } from "@/shared/locale/en/ui/tag-input.ts";
import { uiTimezoneSelectEn } from "@/shared/locale/en/ui/timezone-select.ts";
import { uiUserSelectEn } from "@/shared/locale/en/ui/user-select.ts";
import type { Translations } from "@/shared/locale/types/message";

export const enMessages: Translations = {
  authTranslations: authEn,
  commonTranslations: commonEn,
  errorsTranslations: errorsEn,
  emailsTranslations: emailsEn,
  sessionTranslations: sessionEn,
  smsTranslations: smsEn,
  uiTranslations: {
    catalogImageUpload: uiCatalogImageUploadEn,
    countrySelect: uiCountrySelectEn,
    currencySelect: uiCurrencySelectEn,
    genderSelector: uiGenderSelectorEn,
    languageSelector: uiLanguageSelectorEn,
    localizedString: uiLocalizedStringEn,
    meetingConfig: uiMeetingConfigEn,
    meetingConfigDisplay: uiMeetingConfigDisplayEn,
    meetingConfigJoin: uiMeetingConfigJoinEn,
    meetingConfigManager: uiMeetingConfigManagerEn,
    meetingConfigFields: uiMeetingConfigFieldsEn,
    meetingConfigClassScope: uiMeetingConfigClassScopeEn,
    meetingConfigProviderSelect: uiMeetingConfigProviderSelectEn,
    meetingConfigSummary: uiMeetingConfigSummaryEn,
    meetingConfigRecurringSchedule: uiMeetingConfigRecurringScheduleEn,
    paymentMethod: uiPaymentMethodEn,
    paymentMethodTypeSelector: uiPaymentMethodTypeSelectorEn,
    paymentMethodSelect: uiPaymentMethodSelectEn,
    paymentMethodDisplay: uiPaymentMethodDisplayEn,
    paymentMethodList: uiPaymentMethodListEn,
    paymentMethodManager: uiPaymentMethodManagerEn,
    paymentMethodDefaultsEditor: uiPaymentMethodDefaultsEditorEn,
    paymentMethodTypeFields: uiPaymentMethodTypeFieldsEn,
    paymentMethodType: uiPaymentMethodTypeEn,
    paymentMethodDirection: uiPaymentMethodDirectionEn,
    paymentMethodIdentifier: uiPaymentMethodIdentifierEn,
    phoneInput: uiPhoneInputEn,
    tagInput: uiTagInputEn,
    timezoneSelect: uiTimezoneSelectEn,
    userSelect: uiUserSelectEn,
  },
  dashboardTranslations: {
    admin: dashboardAdminEn,
    adminView: dashboardAdminViewEn,
    dstMigration: dashboardDstMigrationEn,
    billing: dashboardBillingEn,
    billingManual: dashboardBillingManualEn,
    billingPayment: dashboardBillingPaymentEn,
    billingExchangeRates: dashboardBillingExchangeRatesEn,
    billingCurrencyHedges: dashboardBillingCurrencyHedgesEn,
    billingSupportedCurrencies: dashboardBillingSupportedCurrenciesEn,
    classesMain: dashboardClassesMainEn,
    classAudit: dashboardClassAuditEn,
    classDetails: dashboardClassDetailsEn,
    createRecurringClass: dashboardCreateRecurringClassEn,
    rescheduleForm: dashboardRescheduleFormEn,
    rescheduleTracking: dashboardRescheduleTrackingEn,
    scheduleTrackingParent: dashboardScheduleTrackingParentEn,
    complaints: dashboardComplaintsEn,
    feedbackManageParent: dashboardFeedbackManageParentEn,
    coreLayout: dashboardCoreLayoutEn,
    coreNav: dashboardCoreNavEn,
    coreNotifications: dashboardCoreNotificationsEn,
    coreParentDashboard: dashboardCoreParentDashboardEn,
    coreScheduleAlerts: dashboardCoreScheduleAlertsEn,
    coreSearchSchedule: dashboardCoreSearchScheduleEn,
    coreStatusTracking: dashboardCoreStatusTrackingEn,
    lmsCredit: dashboardLmsCreditEn,
    lmsLessonReports: dashboardLmsLessonReportsEn,
    lmsMonthlyReports: dashboardLmsMonthlyReportsEn,
    lmsTeacherDues: dashboardLmsTeacherDuesEn,
    staffDirectory: dashboardStaffDirectoryEn,
    staffOnboarding: dashboardStaffOnboardingEn,
    meetingProviders: dashboardMeetingProvidersEn,
    parentsDirectory: dashboardParentsDirectoryEn,
    parentOnboarding: dashboardParentOnboardingEn,
    parentStudents: dashboardParentStudentsEn,
    parentLifecycle: dashboardParentLifecycleEn,
    parentProfile: dashboardParentProfileEn,
    parentRules: dashboardParentRulesEn,
    parentSocial: dashboardParentSocialEn,
    paymentCatalogs: dashboardPaymentCatalogsEn,
    paymentCatalogsParent: dashboardPaymentCatalogsParentEn,
    usersDirectoryParent: dashboardUsersDirectoryParentEn,
    permissions: dashboardPermissionsEn,
    settings: dashboardSettingsEn,
    reports: dashboardReportsEn,
    resources: dashboardResourcesEn,
    booksAndBags: dashboardBooksAndBagsEn,
    studentPortalDashboard: dashboardStudentPortalDashboardEn,
    studentPortalCredits: dashboardStudentPortalCreditsEn,
    studentPortalHistory: dashboardStudentPortalHistoryEn,
    studentPortalProfile: dashboardStudentPortalProfileEn,
    studentDirectory: dashboardStudentDirectoryEn,
    studentHistory: dashboardStudentHistoryEn,
    studentOnboarding: dashboardStudentOnboardingEn,
    studentProfile: dashboardStudentProfileEn,
    studentQuota: dashboardStudentQuotaEn,
    studentStatus: dashboardStudentStatusEn,
    subjects: dashboardSubjectsEn,
    suggestions: dashboardSuggestionsEn,
    supervisorPortalDashboard: dashboardSupervisorPortalDashboardEn,
    supervisorPortalPendingReviews: dashboardSupervisorPortalPendingReviewsEn,
    supervisorPortalProfile: dashboardSupervisorPortalProfileEn,
    supervisorPortalMonthlyReports: dashboardSupervisorPortalMonthlyReportsEn,
    supervisorPortalTeacherDues: dashboardSupervisorPortalTeacherDuesEn,
    teacherAvailability: dashboardTeacherAvailabilityEn,
    teacherClassList: dashboardTeacherClassListEn,
    teacherCreateRecurringClass: dashboardTeacherCreateRecurringClassEn,
    teacherDashboard: dashboardTeacherDashboardEn,
    teachersDirectory: dashboardTeachersDirectoryEn,
    teacherFutureSchedule: dashboardTeacherFutureScheduleEn,
    teacherOnboarding: dashboardTeacherOnboardingEn,
    teacherOwnProfile: dashboardTeacherOwnProfileEn,
    teacherProfile: dashboardTeacherProfileEn,
    teacherReassignment: dashboardTeacherReassignmentEn,
    teacherStudents: dashboardTeacherStudentsEn,
    teacherWeeklySchedule: dashboardTeacherWeeklyScheduleEn,
  },
  profileTranslations: {
    base: profileEn,
    teacher: profileTeacherEn,
    parent: profileParentEn,
    staff: profileStaffEn,
    notifications: profileNotificationsEn,
  },
  notificationsTranslations: notificationsEn,
};
