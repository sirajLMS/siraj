/** Flattened, dot-free top-level translation schema. */

import type { AppLocale } from "@/shared/locale/AppLocale.ts";
import type { AuthLabels } from "@/shared/locale/types/auth";
import type { CommonLabels } from "@/shared/locale/types/common";
// ─── dashboard/leaf interfaces (collected into DashboardTranslations) ────
import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration.ts";
import type { AdminViewLabels } from "@/shared/locale/types/dashboard/admin/view.ts";
import type { CurrencyHedgesLabels } from "@/shared/locale/types/dashboard/billing/currencyHedges.ts";
import type { ExchangeRatesLabels } from "@/shared/locale/types/dashboard/billing/exchangeRates.ts";
import type { BillingLabels } from "@/shared/locale/types/dashboard/billing/main.ts";
import type { BillingManualLabels } from "@/shared/locale/types/dashboard/billing/manual.ts";
import type { PaymentComponentLabels } from "@/shared/locale/types/dashboard/billing/payment.ts";
import type { SupportedCurrenciesLabels } from "@/shared/locale/types/dashboard/billing/supportedCurrencies.ts";
import type { ClassAuditLabels } from "@/shared/locale/types/dashboard/classes/audit.ts";
import type { CreateRecurringClassLabels } from "@/shared/locale/types/dashboard/classes/createRecurringClass.ts";
import type { ClassDetailsLabels } from "@/shared/locale/types/dashboard/classes/details.ts";
import type { MainLabels as ClassesMainLabels } from "@/shared/locale/types/dashboard/classes/main.ts";
import type { RescheduleFormLabels } from "@/shared/locale/types/dashboard/classes/rescheduleForm.ts";
import type { RescheduleTrackingLabels } from "@/shared/locale/types/dashboard/classes/rescheduleTracking.ts";
import type { ComplaintsLabels } from "@/shared/locale/types/dashboard/complaints";
import type { DashboardCoreLayoutLabels } from "@/shared/locale/types/dashboard/core/layout.ts";
import type { DashboardNavigationLabels } from "@/shared/locale/types/dashboard/core/nav.ts";
import type { DashboardCoreNotificationsLabels } from "@/shared/locale/types/dashboard/core/notifications.ts";
import type { ParentDashboardLabels } from "@/shared/locale/types/dashboard/core/parentDashboard.ts";
import type { ScheduleAlertsLabels } from "@/shared/locale/types/dashboard/core/scheduleAlerts.ts";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule.ts";
import type { StatusTrackingLabels } from "@/shared/locale/types/dashboard/core/statusTracking.ts";
import type { FeedbackManageParentLabels } from "@/shared/locale/types/dashboard/feedback/main.ts";
import type { CreditLabels } from "@/shared/locale/types/dashboard/lms/credit.ts";
import type { LessonReportLabels } from "@/shared/locale/types/dashboard/lms/lessonReports.ts";
import type { MonthlyReportLabels } from "@/shared/locale/types/dashboard/lms/monthlyReports.ts";
import type { TeacherDueLabels } from "@/shared/locale/types/dashboard/lms/teacherDues.ts";
import type { MeetingProvidersLabels } from "@/shared/locale/types/dashboard/meeting-providers/main.ts";
import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents/directory.ts";
import type { ParentLifecycleLabels } from "@/shared/locale/types/dashboard/parents/lifecycle.ts";
import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents/onboarding.ts";
import type { ParentProfileLabels } from "@/shared/locale/types/dashboard/parents/profile.ts";
import type { ParentRulesLabels } from "@/shared/locale/types/dashboard/parents/rules.ts";
import type { ParentSocialLabels } from "@/shared/locale/types/dashboard/parents/social.ts";
import type { ParentStudentsLabels } from "@/shared/locale/types/dashboard/parents/students.ts";
import type { PaymentCatalogsLabels } from "@/shared/locale/types/dashboard/payment-catalogs/main.ts";
import type { PaymentCatalogsParentLabels } from "@/shared/locale/types/dashboard/payment-catalogs/parent.ts";
import type { PermissionsLabels } from "@/shared/locale/types/dashboard/permissions/main.ts";
import type { ReportsLabels } from "@/shared/locale/types/dashboard/reports/main.ts";
import type { BooksAndBagsLabels, ResourcesLabels } from "@/shared/locale/types/dashboard/resources";
import type { ScheduleTrackingParentLabels } from "@/shared/locale/types/dashboard/schedule-tracking/main.ts";
import type { SettingsLabels } from "@/shared/locale/types/dashboard/settings/main.ts";
import type { StaffDirectoryLabels } from "@/shared/locale/types/dashboard/staff/directory.ts";
import type { StaffOnboardingLabels } from "@/shared/locale/types/dashboard/staff/onboarding.ts";
import type { StudentPortalCreditsLabels } from "@/shared/locale/types/dashboard/studentPortal/studentCredits.ts";
import type { StudentPortalDashboardLabels } from "@/shared/locale/types/dashboard/studentPortal/studentDashboard.ts";
import type { StudentPortalHistoryLabels } from "@/shared/locale/types/dashboard/studentPortal/studentHistory.ts";
import type { StudentPortalProfileLabels } from "@/shared/locale/types/dashboard/studentPortal/studentProfile.ts";
import type { StudentDirectoryLabels } from "@/shared/locale/types/dashboard/students/directory.ts";
import type { StudentHistoryLabels } from "@/shared/locale/types/dashboard/students/history.ts";
import type { StudentOnboardingLabels } from "@/shared/locale/types/dashboard/students/onboarding.ts";
import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students/profile.ts";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota.ts";
import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students/status.ts";
import type { SubjectsLabels } from "@/shared/locale/types/dashboard/subjects/main.ts";
import type { SuggestionsLabels } from "@/shared/locale/types/dashboard/suggestions";
import type { SupervisorMonthlyReportsLabels } from "@/shared/locale/types/dashboard/supervisorPortal/monthlyReports.ts";
import type { PendingReviewsLabels } from "@/shared/locale/types/dashboard/supervisorPortal/pendingReviews.ts";
import type { SupervisorPortalProfileLabels } from "@/shared/locale/types/dashboard/supervisorPortal/profile.ts";
import type { SupervisorDashboardLabels } from "@/shared/locale/types/dashboard/supervisorPortal/supervisorDashboard.ts";
import type { SupervisorTeacherDuesLabels } from "@/shared/locale/types/dashboard/supervisorPortal/teacherDues.ts";
import type { TeacherAvailabilityLabels } from "@/shared/locale/types/dashboard/teachers/availability.ts";
import type { TeacherClassListLabels } from "@/shared/locale/types/dashboard/teachers/classList.ts";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass.ts";
import type { TeacherDashboardLabels } from "@/shared/locale/types/dashboard/teachers/dashboard.ts";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory.ts";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule.ts";
import type { TeacherOnboardingLabels } from "@/shared/locale/types/dashboard/teachers/onboarding.ts";
import type { TeacherOwnProfileLabels } from "@/shared/locale/types/dashboard/teachers/ownProfile.ts";
import type { TeacherProfileLabels } from "@/shared/locale/types/dashboard/teachers/profile.ts";
import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers/reassignment.ts";
import type { TeacherStudentsLabels } from "@/shared/locale/types/dashboard/teachers/students.ts";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule.ts";
import type { UsersDirectoryParentLabels } from "@/shared/locale/types/dashboard/users/directory.ts";
import type { EmailsLabels } from "@/shared/locale/types/emails";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { NotificationsLabels } from "@/shared/locale/types/notifications";
import type {
  ProfileLabels,
  ProfileNotificationsLabels,
  ProfileParentLabels,
  ProfileStaffLabels,
  ProfileTeacherLabels,
} from "@/shared/locale/types/profile";
import type { SessionLabels } from "@/shared/locale/types/session";
import type { SmsLabels } from "@/shared/locale/types/sms";

// ─── ui/leaf interfaces (collected into UiTranslations) ──────────────────
import type {
  CatalogImageUploadLabels,
  CountrySelectLabels,
  CurrencySelectLabels,
  GenderSelectorLabels,
  LanguageSelectorLabels,
  LocalizedStringLabels,
  MeetingConfigClassScopeLabels,
  MeetingConfigDisplayLabels,
  MeetingConfigFieldsLabels,
  MeetingConfigJoinLabels,
  MeetingConfigLabels,
  MeetingConfigManagerLabels,
  MeetingConfigProviderSelectLabels,
  MeetingConfigRecurringScheduleLabels,
  MeetingConfigSummaryLabels,
  PaymentMethodDefaultsEditorLabels,
  PaymentMethodDirectionLabels,
  PaymentMethodDisplayLabels,
  PaymentMethodIdentifierLabels,
  PaymentMethodLabels,
  PaymentMethodListLabels,
  PaymentMethodManagerLabels,
  PaymentMethodSelectLabels,
  PaymentMethodTypeFieldsLabels,
  PaymentMethodTypeLabels,
  PaymentMethodTypeSelectorLabels,
  PhoneInputLabels,
  TagInputLabels,
  TimezoneSelectLabels,
  UserSelectLabels,
} from "@/shared/locale/types/ui";

export type { AppLocale };

/** DashboardTranslations — group collector for all dashboard-domain labels. */
export interface DashboardTranslations {
  admin: AdminDashboardLabels;
  adminView: AdminViewLabels;
  dstMigration: DstMigrationLabels;
  billing: BillingLabels;
  billingManual: BillingManualLabels;
  billingPayment: PaymentComponentLabels;
  billingExchangeRates: ExchangeRatesLabels;
  billingCurrencyHedges: CurrencyHedgesLabels;
  billingSupportedCurrencies: SupportedCurrenciesLabels;
  classesMain: ClassesMainLabels;
  classAudit: ClassAuditLabels;
  classDetails: ClassDetailsLabels;
  createRecurringClass: CreateRecurringClassLabels;
  rescheduleForm: RescheduleFormLabels;
  rescheduleTracking: RescheduleTrackingLabels;
  complaints: ComplaintsLabels;
  coreLayout: DashboardCoreLayoutLabels;
  coreNav: DashboardNavigationLabels;
  coreNotifications: DashboardCoreNotificationsLabels;
  coreParentDashboard: ParentDashboardLabels;
  coreScheduleAlerts: ScheduleAlertsLabels;
  coreSearchSchedule: SearchScheduleLabels;
  coreStatusTracking: StatusTrackingLabels;
  lmsCredit: CreditLabels;
  lmsLessonReports: LessonReportLabels;
  lmsMonthlyReports: MonthlyReportLabels;
  lmsTeacherDues: TeacherDueLabels;
  staffDirectory: StaffDirectoryLabels;
  staffOnboarding: StaffOnboardingLabels;
  meetingProviders: MeetingProvidersLabels;
  parentsDirectory: ParentsDirectoryLabels;
  parentOnboarding: ParentOnboardingLabels;
  parentStudents: ParentStudentsLabels;
  parentLifecycle: ParentLifecycleLabels;
  parentProfile: ParentProfileLabels;
  parentRules: ParentRulesLabels;
  parentSocial: ParentSocialLabels;
  feedbackManageParent: FeedbackManageParentLabels;
  usersDirectoryParent: UsersDirectoryParentLabels;
  paymentCatalogs: PaymentCatalogsLabels;
  paymentCatalogsParent: PaymentCatalogsParentLabels;
  scheduleTrackingParent: ScheduleTrackingParentLabels;
  permissions: PermissionsLabels;
  settings: SettingsLabels;
  reports: ReportsLabels;
  resources: ResourcesLabels;
  booksAndBags: BooksAndBagsLabels;
  studentPortalDashboard: StudentPortalDashboardLabels;
  studentPortalCredits: StudentPortalCreditsLabels;
  studentPortalHistory: StudentPortalHistoryLabels;
  studentPortalProfile: StudentPortalProfileLabels;
  studentDirectory: StudentDirectoryLabels;
  studentHistory: StudentHistoryLabels;
  studentOnboarding: StudentOnboardingLabels;
  studentProfile: StudentProfileLabels;
  studentQuota: StudentQuotaLabels;
  studentStatus: StudentStatusLabels;
  subjects: SubjectsLabels;
  suggestions: SuggestionsLabels;
  supervisorPortalMonthlyReports: SupervisorMonthlyReportsLabels;
  supervisorPortalPendingReviews: PendingReviewsLabels;
  supervisorPortalProfile: SupervisorPortalProfileLabels;
  supervisorPortalDashboard: SupervisorDashboardLabels;
  supervisorPortalTeacherDues: SupervisorTeacherDuesLabels;
  teacherAvailability: TeacherAvailabilityLabels;
  teacherClassList: TeacherClassListLabels;
  teacherCreateRecurringClass: TeacherCreateRecurringClassLabels;
  teacherDashboard: TeacherDashboardLabels;
  teachersDirectory: TeachersDirectoryLabels;
  teacherFutureSchedule: TeacherFutureScheduleLabels;
  teacherOnboarding: TeacherOnboardingLabels;
  teacherOwnProfile: TeacherOwnProfileLabels;
  teacherProfile: TeacherProfileLabels;
  teacherReassignment: TeacherReassignmentLabels;
  teacherStudents: TeacherStudentsLabels;
  teacherWeeklySchedule: TeacherWeeklyScheduleLabels;
}

/** UiTranslations — group collector for all UI-domain labels. */
export interface UiTranslations {
  catalogImageUpload: CatalogImageUploadLabels;
  countrySelect: CountrySelectLabels;
  currencySelect: CurrencySelectLabels;
  genderSelector: GenderSelectorLabels;
  languageSelector: LanguageSelectorLabels;
  localizedString: LocalizedStringLabels;
  meetingConfig: MeetingConfigLabels;
  meetingConfigDisplay: MeetingConfigDisplayLabels;
  meetingConfigJoin: MeetingConfigJoinLabels;
  meetingConfigManager: MeetingConfigManagerLabels;
  meetingConfigFields: MeetingConfigFieldsLabels;
  meetingConfigClassScope: MeetingConfigClassScopeLabels;
  meetingConfigProviderSelect: MeetingConfigProviderSelectLabels;
  meetingConfigSummary: MeetingConfigSummaryLabels;
  meetingConfigRecurringSchedule: MeetingConfigRecurringScheduleLabels;
  paymentMethod: PaymentMethodLabels;
  paymentMethodTypeSelector: PaymentMethodTypeSelectorLabels;
  paymentMethodSelect: PaymentMethodSelectLabels;
  paymentMethodDisplay: PaymentMethodDisplayLabels;
  paymentMethodList: PaymentMethodListLabels;
  paymentMethodManager: PaymentMethodManagerLabels;
  paymentMethodDefaultsEditor: PaymentMethodDefaultsEditorLabels;
  paymentMethodTypeFields: PaymentMethodTypeFieldsLabels;
  paymentMethodType: PaymentMethodTypeLabels;
  paymentMethodDirection: PaymentMethodDirectionLabels;
  paymentMethodIdentifier: PaymentMethodIdentifierLabels;
  phoneInput: PhoneInputLabels;
  tagInput: TagInputLabels;
  timezoneSelect: TimezoneSelectLabels;
  userSelect: UserSelectLabels;
}

/** ProfileTranslations — group collector for all profile-domain labels. */
export interface ProfileTranslations {
  base: ProfileLabels;
  teacher: ProfileTeacherLabels;
  parent: ProfileParentLabels;
  staff: ProfileStaffLabels;
  notifications: ProfileNotificationsLabels;
}

export type Translations = {
  authTranslations: AuthLabels;
  commonTranslations: CommonLabels;
  errorsTranslations: ErrorsLabels;
  emailsTranslations: EmailsLabels;
  sessionTranslations: SessionLabels;
  smsTranslations: SmsLabels;
  uiTranslations: UiTranslations;
  dashboardTranslations: DashboardTranslations;
  profileTranslations: ProfileTranslations;
  notificationsTranslations: NotificationsLabels;
};
