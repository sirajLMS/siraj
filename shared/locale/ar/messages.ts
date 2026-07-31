/** Canonical static leaf assembler for server getTranslations (Phase 4). Same leaf modules as defineNamespace loaders. */
import { authAr } from "@/shared/locale/ar/auth";
import { commonAr } from "@/shared/locale/ar/common";
import { dashboardAdminAr } from "@/shared/locale/ar/dashboard/admin";
import { dashboardDstMigrationAr } from "@/shared/locale/ar/dashboard/admin/dstMigration.ts";
import { dashboardAdminViewAr } from "@/shared/locale/ar/dashboard/admin/view.ts";
import { dashboardBillingCurrencyHedgesAr } from "@/shared/locale/ar/dashboard/billing/currencyHedges.ts";
import { dashboardBillingExchangeRatesAr } from "@/shared/locale/ar/dashboard/billing/exchangeRates.ts";
import { dashboardBillingAr } from "@/shared/locale/ar/dashboard/billing/main.ts";
import { dashboardBillingManualAr } from "@/shared/locale/ar/dashboard/billing/manual.ts";
import { dashboardBillingPaymentAr } from "@/shared/locale/ar/dashboard/billing/payment.ts";
import { quotaAr } from "@/shared/locale/ar/dashboard/billing/quota.ts";
import { dashboardBillingSupportedCurrenciesAr } from "@/shared/locale/ar/dashboard/billing/supportedCurrencies.ts";

import { dashboardClassAuditAr } from "@/shared/locale/ar/dashboard/classes/audit.ts";
import { dashboardCreateRecurringClassAr } from "@/shared/locale/ar/dashboard/classes/createRecurringClass.ts";
import { dashboardClassDetailsAr } from "@/shared/locale/ar/dashboard/classes/details.ts";
import { dashboardClassesMainAr } from "@/shared/locale/ar/dashboard/classes/main.ts";
import { dashboardRescheduleFormAr } from "@/shared/locale/ar/dashboard/classes/rescheduleForm.ts";
import { dashboardRescheduleTrackingAr } from "@/shared/locale/ar/dashboard/classes/rescheduleTracking.ts";
import { dashboardComplaintsAr } from "@/shared/locale/ar/dashboard/complaints/main.ts";
import { dashboardCoreLayoutAr } from "@/shared/locale/ar/dashboard/core/layout.ts";
import { dashboardCoreNavAr } from "@/shared/locale/ar/dashboard/core/nav.ts";
import { dashboardCoreNotificationsAr } from "@/shared/locale/ar/dashboard/core/notifications.ts";
import { dashboardCoreParentDashboardAr } from "@/shared/locale/ar/dashboard/core/parentDashboard.ts";
import { dashboardCoreScheduleAlertsAr } from "@/shared/locale/ar/dashboard/core/scheduleAlerts.ts";
import { dashboardCoreSearchScheduleAr } from "@/shared/locale/ar/dashboard/core/searchSchedule.ts";
import { dashboardCoreStatusTrackingAr } from "@/shared/locale/ar/dashboard/core/statusTracking.ts";
import { dashboardFeedbackManageParentAr } from "@/shared/locale/ar/dashboard/feedback/main.ts";
import { dashboardLmsCreditAr } from "@/shared/locale/ar/dashboard/lms/credit.ts";
import { dashboardLmsLessonReportsAr } from "@/shared/locale/ar/dashboard/lms/lessonReports.ts";
import { dashboardLmsMonthlyReportsAr } from "@/shared/locale/ar/dashboard/lms/monthlyReports.ts";
import { dashboardLmsTeacherDuesAr } from "@/shared/locale/ar/dashboard/lms/teacherDues.ts";
import { dashboardMeetingProvidersAr } from "@/shared/locale/ar/dashboard/meeting-providers/main.ts";
import { dashboardParentsDirectoryAr } from "@/shared/locale/ar/dashboard/parents/directory.ts";
import { dashboardParentLifecycleAr } from "@/shared/locale/ar/dashboard/parents/lifecycle.ts";
import { dashboardParentOnboardingAr } from "@/shared/locale/ar/dashboard/parents/onboarding.ts";
import { dashboardParentProfileAr } from "@/shared/locale/ar/dashboard/parents/profile.ts";
import { dashboardParentRulesAr } from "@/shared/locale/ar/dashboard/parents/rules.ts";
import { dashboardParentSocialAr } from "@/shared/locale/ar/dashboard/parents/social.ts";
import { dashboardParentStudentsAr } from "@/shared/locale/ar/dashboard/parents/students.ts";
import { dashboardPaymentCatalogsAr } from "@/shared/locale/ar/dashboard/payment-catalogs/main.ts";
import { dashboardPaymentCatalogsParentAr } from "@/shared/locale/ar/dashboard/payment-catalogs/parent.ts";
import { dashboardPermissionsAr } from "@/shared/locale/ar/dashboard/permissions/main.ts";
import { dashboardReportsAr } from "@/shared/locale/ar/dashboard/reports/main.ts";
import { dashboardBooksAndBagsAr } from "@/shared/locale/ar/dashboard/resources/booksAndBags.ts";
import { dashboardResourcesAr } from "@/shared/locale/ar/dashboard/resources/main.ts";
import { dashboardScheduleTrackingParentAr } from "@/shared/locale/ar/dashboard/schedule-tracking/main.ts";
import { dashboardSettingsAr } from "@/shared/locale/ar/dashboard/settings/main.ts";
import { dashboardStaffDirectoryAr } from "@/shared/locale/ar/dashboard/staff/directory.ts";
import { dashboardStaffOnboardingAr } from "@/shared/locale/ar/dashboard/staff/onboarding.ts";
import { dashboardStudentPortalCreditsAr } from "@/shared/locale/ar/dashboard/studentPortal/studentCredits.ts";
import { dashboardStudentPortalDashboardAr } from "@/shared/locale/ar/dashboard/studentPortal/studentDashboard.ts";
import { dashboardStudentPortalHistoryAr } from "@/shared/locale/ar/dashboard/studentPortal/studentHistory.ts";
import { dashboardStudentPortalProfileAr } from "@/shared/locale/ar/dashboard/studentPortal/studentProfile.ts";
import { dashboardStudentPortalSessionsAr } from "@/shared/locale/ar/dashboard/studentPortal/studentSessions.ts";
import { dashboardStudentDirectoryAr } from "@/shared/locale/ar/dashboard/students/directory.ts";
import { dashboardStudentHistoryAr } from "@/shared/locale/ar/dashboard/students/history.ts";
import { dashboardStudentOnboardingAr } from "@/shared/locale/ar/dashboard/students/onboarding.ts";
import { dashboardStudentProfileAr } from "@/shared/locale/ar/dashboard/students/profile.ts";
import { dashboardStudentQuotaAr } from "@/shared/locale/ar/dashboard/students/quota.ts";
import { dashboardStudentStatusAr } from "@/shared/locale/ar/dashboard/students/status.ts";
import { dashboardSubjectsAr } from "@/shared/locale/ar/dashboard/subjects/main.ts";
import { dashboardSuggestionsAr } from "@/shared/locale/ar/dashboard/suggestions/main.ts";
import { dashboardSupervisorPortalMonthlyReportsAr } from "@/shared/locale/ar/dashboard/supervisorPortal/monthlyReports.ts";
import { dashboardSupervisorPortalPendingReviewsAr } from "@/shared/locale/ar/dashboard/supervisorPortal/pendingReviews.ts";
import { dashboardSupervisorPortalProfileAr } from "@/shared/locale/ar/dashboard/supervisorPortal/profile.ts";
import { dashboardSupervisorPortalDashboardAr } from "@/shared/locale/ar/dashboard/supervisorPortal/supervisorDashboard.ts";
import { dashboardSupervisorPortalTeacherDuesAr } from "@/shared/locale/ar/dashboard/supervisorPortal/teacherDues.ts";
import { dashboardTeacherAvailabilityAr } from "@/shared/locale/ar/dashboard/teachers/availability.ts";
import { dashboardTeacherClassListAr } from "@/shared/locale/ar/dashboard/teachers/classList.ts";
import { dashboardTeacherCreateRecurringClassAr } from "@/shared/locale/ar/dashboard/teachers/createRecurringClass.ts";
import { dashboardTeacherDashboardAr } from "@/shared/locale/ar/dashboard/teachers/dashboard.ts";
import { dashboardTeachersDirectoryAr } from "@/shared/locale/ar/dashboard/teachers/directory.ts";
import { dashboardTeacherFutureScheduleAr } from "@/shared/locale/ar/dashboard/teachers/futureSchedule.ts";
import { dashboardTeacherOnboardingAr } from "@/shared/locale/ar/dashboard/teachers/onboarding.ts";
import { dashboardTeacherOwnProfileAr } from "@/shared/locale/ar/dashboard/teachers/ownProfile.ts";
import { dashboardTeacherProfileAr } from "@/shared/locale/ar/dashboard/teachers/profile.ts";
import { dashboardTeacherReassignmentAr } from "@/shared/locale/ar/dashboard/teachers/reassignment.ts";
import { dashboardTeacherStudentsAr } from "@/shared/locale/ar/dashboard/teachers/students.ts";
import { dashboardTeacherWeeklyScheduleAr } from "@/shared/locale/ar/dashboard/teachers/weeklySchedule.ts";
import { dashboardUsersDirectoryParentAr } from "@/shared/locale/ar/dashboard/users/directory.ts";
import { emailsAr } from "@/shared/locale/ar/emails";
import { errorsAr } from "@/shared/locale/ar/errors";
import { notificationsAr } from "@/shared/locale/ar/notifications";
import { profileNotificationsAr } from "@/shared/locale/ar/profile/notifications";
import { profileParentAr } from "@/shared/locale/ar/profile/parent";
import { profileStaffAr } from "@/shared/locale/ar/profile/staff";
import { profileTeacherAr } from "@/shared/locale/ar/profile/teacher";
import { profileAr } from "@/shared/locale/ar/profile.ts";
import { sessionAr } from "@/shared/locale/ar/session";
import { smsAr } from "@/shared/locale/ar/sms";
import { uiCatalogImageUploadAr } from "@/shared/locale/ar/ui/catalog-image-upload.ts";
import { uiCountrySelectAr } from "@/shared/locale/ar/ui/country-select.ts";
import { uiCurrencySelectAr } from "@/shared/locale/ar/ui/currency-select.ts";
import { uiGenderSelectorAr } from "@/shared/locale/ar/ui/gender-selector.ts";
import { uiLanguageSelectorAr } from "@/shared/locale/ar/ui/language-selector.ts";
import { uiLocalizedStringAr } from "@/shared/locale/ar/ui/localized-string.ts";
import { uiMeetingConfigAr } from "@/shared/locale/ar/ui/meeting-config.ts";
import { uiMeetingConfigClassScopeAr } from "@/shared/locale/ar/ui/meetingConfig/classScope.ts";
import { uiMeetingConfigDisplayAr } from "@/shared/locale/ar/ui/meetingConfig/display.ts";
import { uiMeetingConfigFieldsAr } from "@/shared/locale/ar/ui/meetingConfig/fields.ts";
import { uiMeetingConfigJoinAr } from "@/shared/locale/ar/ui/meetingConfig/join.ts";
import { uiMeetingConfigManagerAr } from "@/shared/locale/ar/ui/meetingConfig/manager.ts";
import { uiMeetingConfigProviderSelectAr } from "@/shared/locale/ar/ui/meetingConfig/providerSelect.ts";
import { uiMeetingConfigRecurringScheduleAr } from "@/shared/locale/ar/ui/meetingConfig/recurringSchedule.ts";
import { uiMeetingConfigSummaryAr } from "@/shared/locale/ar/ui/meetingConfig/summary.ts";
import { uiPaymentMethodAr } from "@/shared/locale/ar/ui/payment-method.ts";
import { uiPaymentMethodDefaultsEditorAr } from "@/shared/locale/ar/ui/paymentMethod/defaultsEditor.ts";
import { uiPaymentMethodDirectionAr } from "@/shared/locale/ar/ui/paymentMethod/direction.ts";
import { uiPaymentMethodDisplayAr } from "@/shared/locale/ar/ui/paymentMethod/display.ts";
import { uiPaymentMethodIdentifierAr } from "@/shared/locale/ar/ui/paymentMethod/identifier.ts";
import { uiPaymentMethodListAr } from "@/shared/locale/ar/ui/paymentMethod/list.ts";
import { uiPaymentMethodManagerAr } from "@/shared/locale/ar/ui/paymentMethod/manager.ts";
import { uiPaymentMethodSelectAr } from "@/shared/locale/ar/ui/paymentMethod/select.ts";
import { uiPaymentMethodTypeAr } from "@/shared/locale/ar/ui/paymentMethod/type.ts";
import { uiPaymentMethodTypeFieldsAr } from "@/shared/locale/ar/ui/paymentMethod/typeFields.ts";
import { uiPaymentMethodTypeSelectorAr } from "@/shared/locale/ar/ui/paymentMethod/typeSelector.ts";
import { uiPhoneInputAr } from "@/shared/locale/ar/ui/phone-input.ts";
import { uiTagInputAr } from "@/shared/locale/ar/ui/tag-input.ts";
import { uiTimezoneSelectAr } from "@/shared/locale/ar/ui/timezone-select.ts";
import { uiUserSelectAr } from "@/shared/locale/ar/ui/user-select.ts";
import type { Translations } from "@/shared/locale/types/message";

export const arMessages: Translations = {
  authTranslations: authAr,
  commonTranslations: commonAr,
  errorsTranslations: errorsAr,
  emailsTranslations: emailsAr,
  sessionTranslations: sessionAr,
  smsTranslations: smsAr,
  uiTranslations: {
    catalogImageUpload: uiCatalogImageUploadAr,
    countrySelect: uiCountrySelectAr,
    currencySelect: uiCurrencySelectAr,
    genderSelector: uiGenderSelectorAr,
    languageSelector: uiLanguageSelectorAr,
    localizedString: uiLocalizedStringAr,
    meetingConfig: uiMeetingConfigAr,
    meetingConfigDisplay: uiMeetingConfigDisplayAr,
    meetingConfigJoin: uiMeetingConfigJoinAr,
    meetingConfigManager: uiMeetingConfigManagerAr,
    meetingConfigFields: uiMeetingConfigFieldsAr,
    meetingConfigClassScope: uiMeetingConfigClassScopeAr,
    meetingConfigProviderSelect: uiMeetingConfigProviderSelectAr,
    meetingConfigSummary: uiMeetingConfigSummaryAr,
    meetingConfigRecurringSchedule: uiMeetingConfigRecurringScheduleAr,
    paymentMethod: uiPaymentMethodAr,
    paymentMethodTypeSelector: uiPaymentMethodTypeSelectorAr,
    paymentMethodSelect: uiPaymentMethodSelectAr,
    paymentMethodDisplay: uiPaymentMethodDisplayAr,
    paymentMethodList: uiPaymentMethodListAr,
    paymentMethodManager: uiPaymentMethodManagerAr,
    paymentMethodDefaultsEditor: uiPaymentMethodDefaultsEditorAr,
    paymentMethodTypeFields: uiPaymentMethodTypeFieldsAr,
    paymentMethodType: uiPaymentMethodTypeAr,
    paymentMethodDirection: uiPaymentMethodDirectionAr,
    paymentMethodIdentifier: uiPaymentMethodIdentifierAr,
    phoneInput: uiPhoneInputAr,
    tagInput: uiTagInputAr,
    timezoneSelect: uiTimezoneSelectAr,
    userSelect: uiUserSelectAr,
  },
  dashboardTranslations: {
    admin: dashboardAdminAr,
    adminView: dashboardAdminViewAr,
    dstMigration: dashboardDstMigrationAr,
    billing: dashboardBillingAr,
    billingManual: dashboardBillingManualAr,
    billingQuota: quotaAr,
    billingPayment: dashboardBillingPaymentAr,

    billingExchangeRates: dashboardBillingExchangeRatesAr,
    billingCurrencyHedges: dashboardBillingCurrencyHedgesAr,
    billingSupportedCurrencies: dashboardBillingSupportedCurrenciesAr,
    classesMain: dashboardClassesMainAr,
    classAudit: dashboardClassAuditAr,
    classDetails: dashboardClassDetailsAr,
    createRecurringClass: dashboardCreateRecurringClassAr,
    rescheduleForm: dashboardRescheduleFormAr,
    rescheduleTracking: dashboardRescheduleTrackingAr,
    scheduleTrackingParent: dashboardScheduleTrackingParentAr,
    complaints: dashboardComplaintsAr,
    feedbackManageParent: dashboardFeedbackManageParentAr,
    coreLayout: dashboardCoreLayoutAr,
    coreNav: dashboardCoreNavAr,
    coreNotifications: dashboardCoreNotificationsAr,
    coreParentDashboard: dashboardCoreParentDashboardAr,
    coreScheduleAlerts: dashboardCoreScheduleAlertsAr,
    coreSearchSchedule: dashboardCoreSearchScheduleAr,
    coreStatusTracking: dashboardCoreStatusTrackingAr,
    lmsCredit: dashboardLmsCreditAr,
    lmsLessonReports: dashboardLmsLessonReportsAr,
    lmsMonthlyReports: dashboardLmsMonthlyReportsAr,
    lmsTeacherDues: dashboardLmsTeacherDuesAr,
    staffDirectory: dashboardStaffDirectoryAr,
    staffOnboarding: dashboardStaffOnboardingAr,
    meetingProviders: dashboardMeetingProvidersAr,
    parentsDirectory: dashboardParentsDirectoryAr,
    parentOnboarding: dashboardParentOnboardingAr,
    parentStudents: dashboardParentStudentsAr,
    parentLifecycle: dashboardParentLifecycleAr,
    parentProfile: dashboardParentProfileAr,
    parentRules: dashboardParentRulesAr,
    parentSocial: dashboardParentSocialAr,
    paymentCatalogs: dashboardPaymentCatalogsAr,
    paymentCatalogsParent: dashboardPaymentCatalogsParentAr,
    usersDirectoryParent: dashboardUsersDirectoryParentAr,
    permissions: dashboardPermissionsAr,
    settings: dashboardSettingsAr,
    reports: dashboardReportsAr,
    resources: dashboardResourcesAr,
    booksAndBags: dashboardBooksAndBagsAr,
    studentPortalDashboard: dashboardStudentPortalDashboardAr,
    studentPortalCredits: dashboardStudentPortalCreditsAr,
    studentPortalHistory: dashboardStudentPortalHistoryAr,
    studentPortalSessions: dashboardStudentPortalSessionsAr,
    studentPortalProfile: dashboardStudentPortalProfileAr,
    studentDirectory: dashboardStudentDirectoryAr,
    studentHistory: dashboardStudentHistoryAr,
    studentOnboarding: dashboardStudentOnboardingAr,
    studentProfile: dashboardStudentProfileAr,
    studentQuota: dashboardStudentQuotaAr,
    studentStatus: dashboardStudentStatusAr,
    subjects: dashboardSubjectsAr,
    suggestions: dashboardSuggestionsAr,
    supervisorPortalDashboard: dashboardSupervisorPortalDashboardAr,
    supervisorPortalPendingReviews: dashboardSupervisorPortalPendingReviewsAr,
    supervisorPortalProfile: dashboardSupervisorPortalProfileAr,
    supervisorPortalMonthlyReports: dashboardSupervisorPortalMonthlyReportsAr,
    supervisorPortalTeacherDues: dashboardSupervisorPortalTeacherDuesAr,
    teacherAvailability: dashboardTeacherAvailabilityAr,
    teacherClassList: dashboardTeacherClassListAr,
    teacherCreateRecurringClass: dashboardTeacherCreateRecurringClassAr,
    teacherDashboard: dashboardTeacherDashboardAr,
    teachersDirectory: dashboardTeachersDirectoryAr,
    teacherFutureSchedule: dashboardTeacherFutureScheduleAr,
    teacherOnboarding: dashboardTeacherOnboardingAr,
    teacherOwnProfile: dashboardTeacherOwnProfileAr,
    teacherProfile: dashboardTeacherProfileAr,
    teacherReassignment: dashboardTeacherReassignmentAr,
    teacherStudents: dashboardTeacherStudentsAr,
    teacherWeeklySchedule: dashboardTeacherWeeklyScheduleAr,
  },
  profileTranslations: {
    base: profileAr,
    teacher: profileTeacherAr,
    parent: profileParentAr,
    staff: profileStaffAr,
    notifications: profileNotificationsAr,
  },
  notificationsTranslations: notificationsAr,
};
