import { authEn } from "@/shared/locale/en/auth";
import { commonEn } from "@/shared/locale/en/common";
import { dashboardAdminEn } from "@/shared/locale/en/dashboard/admin";
import { dashboardDstMigrationEn } from "@/shared/locale/en/dashboard/admin/dstMigration";
import { dashboardAdminViewEn } from "@/shared/locale/en/dashboard/admin/view";
import { dashboardBillingCurrencyHedgesEn } from "@/shared/locale/en/dashboard/billing/currencyHedges";
import { dashboardBillingExchangeRatesEn } from "@/shared/locale/en/dashboard/billing/exchangeRates";
import { dashboardBillingEn } from "@/shared/locale/en/dashboard/billing/main";
import { dashboardBillingManualEn } from "@/shared/locale/en/dashboard/billing/manual";
import { dashboardBillingPaymentEn } from "@/shared/locale/en/dashboard/billing/payment";
import { dashboardBillingSupportedCurrenciesEn } from "@/shared/locale/en/dashboard/billing/supportedCurrencies";
import { dashboardClassAuditEn } from "@/shared/locale/en/dashboard/classes/audit";
import { dashboardCreateRecurringClassEn } from "@/shared/locale/en/dashboard/classes/createRecurringClass";
import { dashboardClassDetailsEn } from "@/shared/locale/en/dashboard/classes/details";
import { dashboardClassesMainEn } from "@/shared/locale/en/dashboard/classes/main";
import { dashboardRescheduleFormEn } from "@/shared/locale/en/dashboard/classes/rescheduleForm";
import { dashboardRescheduleTrackingEn } from "@/shared/locale/en/dashboard/classes/rescheduleTracking";
import { dashboardComplaintsEn } from "@/shared/locale/en/dashboard/complaints/main";
import { dashboardCoreLayoutEn } from "@/shared/locale/en/dashboard/core/layout";
import { dashboardCoreNavEn } from "@/shared/locale/en/dashboard/core/nav";
import { dashboardCoreNotificationsEn } from "@/shared/locale/en/dashboard/core/notifications";
import { dashboardCoreParentDashboardEn } from "@/shared/locale/en/dashboard/core/parentDashboard";
import { dashboardCoreScheduleAlertsEn } from "@/shared/locale/en/dashboard/core/scheduleAlerts";
import { dashboardCoreSearchScheduleEn } from "@/shared/locale/en/dashboard/core/searchSchedule";
import { dashboardCoreStatusTrackingEn } from "@/shared/locale/en/dashboard/core/statusTracking";
import { dashboardLmsCreditEn } from "@/shared/locale/en/dashboard/lms/credit";
import { dashboardLmsLessonReportsEn } from "@/shared/locale/en/dashboard/lms/lessonReports";
import { dashboardLmsMonthlyReportsEn } from "@/shared/locale/en/dashboard/lms/monthlyReports";
import { dashboardLmsTeacherDuesEn } from "@/shared/locale/en/dashboard/lms/teacherDues";
import { dashboardMeetingProvidersEn } from "@/shared/locale/en/dashboard/meeting-providers/main";
import { dashboardParentsDirectoryEn } from "@/shared/locale/en/dashboard/parents/directory";
import { dashboardParentLifecycleEn } from "@/shared/locale/en/dashboard/parents/lifecycle";
import { dashboardParentOnboardingEn } from "@/shared/locale/en/dashboard/parents/onboarding";
import { dashboardParentProfileEn } from "@/shared/locale/en/dashboard/parents/profile";
import { dashboardParentRulesEn } from "@/shared/locale/en/dashboard/parents/rules";
import { dashboardParentSocialEn } from "@/shared/locale/en/dashboard/parents/social";
import { dashboardParentStudentsEn } from "@/shared/locale/en/dashboard/parents/students";
import { dashboardPaymentCatalogsEn } from "@/shared/locale/en/dashboard/payment-catalogs/main";
import { dashboardPermissionsEn } from "@/shared/locale/en/dashboard/permissions/main";
import { dashboardReportsEn } from "@/shared/locale/en/dashboard/reports/main";
import { dashboardBooksAndBagsEn } from "@/shared/locale/en/dashboard/resources/booksAndBags";
import { dashboardResourcesEn } from "@/shared/locale/en/dashboard/resources/main";
import { dashboardSettingsEn } from "@/shared/locale/en/dashboard/settings/main";
import { dashboardStaffDirectoryEn } from "@/shared/locale/en/dashboard/staff/directory";
import { dashboardStaffOnboardingEn } from "@/shared/locale/en/dashboard/staff/onboarding";
import { dashboardStudentPortalCreditsEn } from "@/shared/locale/en/dashboard/studentPortal/studentCredits";
import { dashboardStudentPortalDashboardEn } from "@/shared/locale/en/dashboard/studentPortal/studentDashboard";
import { dashboardStudentPortalHistoryEn } from "@/shared/locale/en/dashboard/studentPortal/studentHistory";
import { dashboardStudentPortalProfileEn } from "@/shared/locale/en/dashboard/studentPortal/studentProfile";
import { dashboardStudentDirectoryEn } from "@/shared/locale/en/dashboard/students/directory";
import { dashboardStudentHistoryEn } from "@/shared/locale/en/dashboard/students/history";
import { dashboardStudentOnboardingEn } from "@/shared/locale/en/dashboard/students/onboarding";
import { dashboardStudentProfileEn } from "@/shared/locale/en/dashboard/students/profile";
import { dashboardStudentQuotaEn } from "@/shared/locale/en/dashboard/students/quota";
import { dashboardStudentStatusEn } from "@/shared/locale/en/dashboard/students/status";
import { dashboardSubjectsEn } from "@/shared/locale/en/dashboard/subjects/main";
import { dashboardSuggestionsEn } from "@/shared/locale/en/dashboard/suggestions/main";
import { dashboardSupervisorPortalMonthlyReportsEn } from "@/shared/locale/en/dashboard/supervisorPortal/monthlyReports";
import { dashboardSupervisorPortalPendingReviewsEn } from "@/shared/locale/en/dashboard/supervisorPortal/pendingReviews";
import { dashboardSupervisorPortalProfileEn } from "@/shared/locale/en/dashboard/supervisorPortal/profile";
import { dashboardSupervisorPortalDashboardEn } from "@/shared/locale/en/dashboard/supervisorPortal/supervisorDashboard";
import { dashboardSupervisorPortalTeacherDuesEn } from "@/shared/locale/en/dashboard/supervisorPortal/teacherDues";
import { dashboardTeacherAvailabilityEn } from "@/shared/locale/en/dashboard/teachers/availability";
import { dashboardTeacherClassListEn } from "@/shared/locale/en/dashboard/teachers/classList";
import { dashboardTeacherCreateRecurringClassEn } from "@/shared/locale/en/dashboard/teachers/createRecurringClass";
import { dashboardTeacherDashboardEn } from "@/shared/locale/en/dashboard/teachers/dashboard";
import { dashboardTeachersDirectoryEn } from "@/shared/locale/en/dashboard/teachers/directory";
import { dashboardTeacherFutureScheduleEn } from "@/shared/locale/en/dashboard/teachers/futureSchedule";
import { dashboardTeacherOnboardingEn } from "@/shared/locale/en/dashboard/teachers/onboarding";
import { dashboardTeacherOwnProfileEn } from "@/shared/locale/en/dashboard/teachers/ownProfile";
import { dashboardTeacherProfileEn } from "@/shared/locale/en/dashboard/teachers/profile";
import { dashboardTeacherReassignmentEn } from "@/shared/locale/en/dashboard/teachers/reassignment";
import { dashboardTeacherStudentsEn } from "@/shared/locale/en/dashboard/teachers/students";
import { dashboardTeacherWeeklyScheduleEn } from "@/shared/locale/en/dashboard/teachers/weeklySchedule";
import { emailsEn } from "@/shared/locale/en/emails";
import { errorsEn } from "@/shared/locale/en/errors";
import { notificationsEn } from "@/shared/locale/en/notifications";
import { profileEn } from "@/shared/locale/en/profile";
import { profileNotificationsEn } from "@/shared/locale/en/profile/notifications";
import { profileParentEn } from "@/shared/locale/en/profile/parent";
import { profileStaffEn } from "@/shared/locale/en/profile/staff";
import { profileTeacherEn } from "@/shared/locale/en/profile/teacher";
import { sessionEn } from "@/shared/locale/en/session";
import { smsEn } from "@/shared/locale/en/sms";
import { uiCatalogImageUploadEn } from "@/shared/locale/en/ui/catalog-image-upload";
import { uiCountrySelectEn } from "@/shared/locale/en/ui/country-select";
import { uiCurrencySelectEn } from "@/shared/locale/en/ui/currency-select";
import { uiGenderSelectorEn } from "@/shared/locale/en/ui/gender-selector";
import { uiLanguageSelectorEn } from "@/shared/locale/en/ui/language-selector";
import { uiLocalizedStringEn } from "@/shared/locale/en/ui/localized-string";
import { uiMeetingConfigEn } from "@/shared/locale/en/ui/meeting-config";
import { uiMeetingConfigClassScopeEn } from "@/shared/locale/en/ui/meetingConfig/classScope";
import { uiMeetingConfigDisplayEn } from "@/shared/locale/en/ui/meetingConfig/display";
import { uiMeetingConfigFieldsEn } from "@/shared/locale/en/ui/meetingConfig/fields";
import { uiMeetingConfigJoinEn } from "@/shared/locale/en/ui/meetingConfig/join";
import { uiMeetingConfigManagerEn } from "@/shared/locale/en/ui/meetingConfig/manager";
import { uiMeetingConfigProviderSelectEn } from "@/shared/locale/en/ui/meetingConfig/providerSelect";
import { uiMeetingConfigRecurringScheduleEn } from "@/shared/locale/en/ui/meetingConfig/recurringSchedule";
import { uiMeetingConfigSummaryEn } from "@/shared/locale/en/ui/meetingConfig/summary";
import { uiPaymentMethodEn } from "@/shared/locale/en/ui/payment-method";
import { uiPaymentMethodDefaultsEditorEn } from "@/shared/locale/en/ui/paymentMethod/defaultsEditor";
import { uiPaymentMethodDirectionEn } from "@/shared/locale/en/ui/paymentMethod/direction";
import { uiPaymentMethodDisplayEn } from "@/shared/locale/en/ui/paymentMethod/display";
import { uiPaymentMethodIdentifierEn } from "@/shared/locale/en/ui/paymentMethod/identifier";
import { uiPaymentMethodListEn } from "@/shared/locale/en/ui/paymentMethod/list";
import { uiPaymentMethodManagerEn } from "@/shared/locale/en/ui/paymentMethod/manager";
import { uiPaymentMethodSelectEn } from "@/shared/locale/en/ui/paymentMethod/select";
import { uiPaymentMethodTypeEn } from "@/shared/locale/en/ui/paymentMethod/type";
import { uiPaymentMethodTypeFieldsEn } from "@/shared/locale/en/ui/paymentMethod/typeFields";
import { uiPaymentMethodTypeSelectorEn } from "@/shared/locale/en/ui/paymentMethod/typeSelector";
import { uiPhoneInputEn } from "@/shared/locale/en/ui/phone-input";
import { uiTagInputEn } from "@/shared/locale/en/ui/tag-input";
import { uiTimezoneSelectEn } from "@/shared/locale/en/ui/timezone-select";
import { uiUserSelectEn } from "@/shared/locale/en/ui/user-select";
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
    complaints: dashboardComplaintsEn,
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
