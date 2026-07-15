import type { AuthLabels } from "@/shared/locale/types/auth";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";
import type { AdminViewLabels } from "@/shared/locale/types/dashboard/admin/view";
import type { CurrencyHedgesLabels } from "@/shared/locale/types/dashboard/billing/currencyHedges";
import type { ExchangeRatesLabels } from "@/shared/locale/types/dashboard/billing/exchangeRates";
import type { BillingLabels } from "@/shared/locale/types/dashboard/billing/main";
import type { BillingManualLabels } from "@/shared/locale/types/dashboard/billing/manual";
import type { PaymentComponentLabels } from "@/shared/locale/types/dashboard/billing/payment";
import type { SupportedCurrenciesLabels } from "@/shared/locale/types/dashboard/billing/supportedCurrencies";
import type { ClassAuditLabels } from "@/shared/locale/types/dashboard/classes/audit";
import type { ClassDetailsLabels } from "@/shared/locale/types/dashboard/classes/details";
import type { MainLabels as ClassesMainLabels } from "@/shared/locale/types/dashboard/classes/main";
import type { RescheduleFormLabels } from "@/shared/locale/types/dashboard/classes/rescheduleForm";
import type { RescheduleTrackingLabels } from "@/shared/locale/types/dashboard/classes/rescheduleTracking";
import type { ComplaintsLabels } from "@/shared/locale/types/dashboard/complaints";
import type { DashboardCoreLayoutLabels } from "@/shared/locale/types/dashboard/core/layout";
import type { DashboardNavigationLabels } from "@/shared/locale/types/dashboard/core/nav";
import type { DashboardCoreNotificationsLabels } from "@/shared/locale/types/dashboard/core/notifications";
import type { ParentDashboardLabels } from "@/shared/locale/types/dashboard/core/parentDashboard";
import type { ScheduleAlertsLabels } from "@/shared/locale/types/dashboard/core/scheduleAlerts";
import type { StatusTrackingLabels } from "@/shared/locale/types/dashboard/core/statusTracking";
import type { CreditLabels } from "@/shared/locale/types/dashboard/lms/credit";
import type { LessonReportLabels } from "@/shared/locale/types/dashboard/lms/lessonReports";
import type { MonthlyReportLabels } from "@/shared/locale/types/dashboard/lms/monthlyReports";
import type { TeacherDueLabels } from "@/shared/locale/types/dashboard/lms/teacherDues";
import type { ManagersDirectoryLabels } from "@/shared/locale/types/dashboard/managers/directory";
import type { ManagerOnboardingLabels } from "@/shared/locale/types/dashboard/managers/onboarding";
import type { MeetingProvidersLabels } from "@/shared/locale/types/dashboard/meeting-providers/main";
import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents/directory";
import type { ParentLifecycleLabels } from "@/shared/locale/types/dashboard/parents/lifecycle";
import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents/onboarding";
import type { ParentProfileLabels } from "@/shared/locale/types/dashboard/parents/profile";
import type { ParentRulesLabels } from "@/shared/locale/types/dashboard/parents/rules";
import type { ParentSocialLabels } from "@/shared/locale/types/dashboard/parents/social";
import type { ParentStudentsLabels } from "@/shared/locale/types/dashboard/parents/students";
import type { PaymentCatalogsLabels } from "@/shared/locale/types/dashboard/payment-catalogs/main";
import type { PermissionsLabels } from "@/shared/locale/types/dashboard/permissions/main";
import type { ReportsLabels } from "@/shared/locale/types/dashboard/reports";
import type { BooksAndBagsLabels, ResourcesLabels } from "@/shared/locale/types/dashboard/resources";
import type { StudentCreditsLabels } from "@/shared/locale/types/dashboard/studentPortal/studentCredits";
import type { StudentDashboardLabels as StudentPortalDashboardLabels } from "@/shared/locale/types/dashboard/studentPortal/studentDashboard";
import type { StudentHistoryLabels as StudentPortalHistoryLabels } from "@/shared/locale/types/dashboard/studentPortal/studentHistory";
import type { StudentProfileLabels as StudentPortalProfileLabels } from "@/shared/locale/types/dashboard/studentPortal/studentProfile";
import type { StudentDirectoryLabels } from "@/shared/locale/types/dashboard/students";
import type { StudentHistoryLabels } from "@/shared/locale/types/dashboard/students/history";
import type { StudentOnboardingLabels } from "@/shared/locale/types/dashboard/students/onboarding";
import type { StudentProfileLabels } from "@/shared/locale/types/dashboard/students/profile";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";
import type { StudentStatusLabels } from "@/shared/locale/types/dashboard/students/status";
import type { SubjectsLabels } from "@/shared/locale/types/dashboard/subjects";
import type { SuggestionsLabels } from "@/shared/locale/types/dashboard/suggestions";
import type { SupervisorMonthlyReportsLabels } from "@/shared/locale/types/dashboard/supervisorPortal/monthlyReports";
import type { PendingReviewsLabels } from "@/shared/locale/types/dashboard/supervisorPortal/pendingReviews";
import type { SupervisorDashboardLabels } from "@/shared/locale/types/dashboard/supervisorPortal/supervisorDashboard";
import type { SupervisorTeacherDuesLabels } from "@/shared/locale/types/dashboard/supervisorPortal/teacherDues";
import type { TeacherAvailabilityLabels } from "@/shared/locale/types/dashboard/teachers/availability";
import type { TeacherClassListLabels } from "@/shared/locale/types/dashboard/teachers/classList";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";
import type { TeacherDashboardLabels } from "@/shared/locale/types/dashboard/teachers/dashboard";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";
import type { TeacherOnboardingLabels } from "@/shared/locale/types/dashboard/teachers/onboarding";
import type { TeacherOwnProfileLabels } from "@/shared/locale/types/dashboard/teachers/ownProfile";
import type { TeacherProfileLabels } from "@/shared/locale/types/dashboard/teachers/profile";
import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers/reassignment";
import type { TeacherStudentsLabels } from "@/shared/locale/types/dashboard/teachers/students";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { EmailsLabels } from "@/shared/locale/types/emails";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { ProfileLabels } from "@/shared/locale/types/profile";
import type { SessionLabels } from "@/shared/locale/types/session";
import type { SmsLabels } from "@/shared/locale/types/sms";
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
  PaymentMethodDisplayLabels,
  PaymentMethodLabels,
  PaymentMethodListLabels,
  PaymentMethodManagerLabels,
  PaymentMethodTypeSelectorLabels,
  PaymentMethodTypeFieldsLabels,
  PaymentMethodDefaultsEditorLabels,
  PhoneInputLabels,
  TagInputLabels,
  TimezoneSelectLabels,
} from "@/shared/locale/types/ui";

export type MessageSchema = {
  auth: AuthLabels;
  common: CommonLabels;
  errors: ErrorsLabels;
  "dashboard.admin": AdminDashboardLabels;
  "dashboard.adminView": AdminViewLabels;
  "dashboard.lms.credit": CreditLabels;
  "dashboard.lms.lessonReports": LessonReportLabels;
  "dashboard.lms.monthlyReports": MonthlyReportLabels;
  "dashboard.lms.teacherDues": TeacherDueLabels;
  "dashboard.managersDirectory": ManagersDirectoryLabels;
  "dashboard.managerOnboarding": ManagerOnboardingLabels;
  "dashboard.parentsDirectory": ParentsDirectoryLabels;
  "dashboard.parentOnboarding": ParentOnboardingLabels;
  "dashboard.parentStudents": ParentStudentsLabels;
  "dashboard.parentLifecycle": ParentLifecycleLabels;
  "dashboard.parentProfile": ParentProfileLabels;
  "dashboard.parentRules": ParentRulesLabels;
  "dashboard.parentSocial": ParentSocialLabels;
  "dashboard.permissions": PermissionsLabels;
  "dashboard.paymentCatalogs": PaymentCatalogsLabels;
  "dashboard.studentDirectory": StudentDirectoryLabels;
  "dashboard.studentHistory": StudentHistoryLabels;
  "dashboard.studentOnboarding": StudentOnboardingLabels;
  "dashboard.studentProfile": StudentProfileLabels;
  "dashboard.studentQuota": StudentQuotaLabels;
  "dashboard.studentStatus": StudentStatusLabels;
  "dashboard.teacherAvailability": TeacherAvailabilityLabels;
  "dashboard.teacherDashboard": TeacherDashboardLabels;
  "dashboard.teacherFutureSchedule": TeacherFutureScheduleLabels;
  "dashboard.teacherProfile": TeacherProfileLabels;
  "dashboard.teacherReassignment": TeacherReassignmentLabels;
  "dashboard.billing": BillingLabels;
  "dashboard.billing.manual": BillingManualLabels;
  "dashboard.billing.payment": PaymentComponentLabels;
  "dashboard.billing.exchangeRates": ExchangeRatesLabels;
  "dashboard.billing.currencyHedges": CurrencyHedgesLabels;
  "dashboard.billing.supportedCurrencies": SupportedCurrenciesLabels;
  "dashboard.booksAndBags": BooksAndBagsLabels;
  "dashboard.classes.main": ClassesMainLabels;
  "dashboard.classAudit": ClassAuditLabels;
  "dashboard.classDetails": ClassDetailsLabels;
  "dashboard.rescheduleForm": RescheduleFormLabels;
  "dashboard.rescheduleTracking": RescheduleTrackingLabels;
  "dashboard.complaints": ComplaintsLabels;
  "dashboard.core.layout": DashboardCoreLayoutLabels;
  "dashboard.core.nav": DashboardNavigationLabels;
  "dashboard.core.notifications": DashboardCoreNotificationsLabels;
  "dashboard.core.parentDashboard": ParentDashboardLabels;
  "dashboard.core.scheduleAlerts": ScheduleAlertsLabels;
  "dashboard.core.searchSchedule": SearchScheduleLabels;
  "dashboard.core.statusTracking": StatusTrackingLabels;
  "dashboard.dstMigration": DstMigrationLabels;
  "dashboard.meetingProviders": MeetingProvidersLabels;
  "dashboard.resources": ResourcesLabels;
  "dashboard.reports": ReportsLabels;
  "dashboard.subjects": SubjectsLabels;
  "dashboard.suggestions": SuggestionsLabels;
  "dashboard.teacherClassList": TeacherClassListLabels;
  "dashboard.teachersDirectory": TeachersDirectoryLabels;
  "dashboard.teacherCreateRecurringClass": TeacherCreateRecurringClassLabels;
  "dashboard.teacherOnboarding": TeacherOnboardingLabels;
  "dashboard.teacherOwnProfile": TeacherOwnProfileLabels;
  "dashboard.teacherStudents": TeacherStudentsLabels;
  "dashboard.teacherWeeklySchedule": TeacherWeeklyScheduleLabels;
  "dashboard.studentPortal.dashboard": StudentPortalDashboardLabels;
  "dashboard.studentPortal.credits": StudentCreditsLabels;
  "dashboard.studentPortal.history": StudentPortalHistoryLabels;
  "dashboard.studentPortal.profile": StudentPortalProfileLabels;
  "dashboard.supervisorPortal.dashboard": SupervisorDashboardLabels;
  "dashboard.supervisorPortal.pendingReviews": PendingReviewsLabels;
  "dashboard.supervisorPortal.monthlyReports": SupervisorMonthlyReportsLabels;
  "dashboard.supervisorPortal.teacherDues": SupervisorTeacherDuesLabels;
  emails: EmailsLabels;
  profile: ProfileLabels;
  session: SessionLabels;
  sms: SmsLabels;
  "ui.catalogImageUpload": CatalogImageUploadLabels;
  "ui.countrySelect": CountrySelectLabels;
  "ui.currencySelect": CurrencySelectLabels;
  "ui.genderSelector": GenderSelectorLabels;
  "ui.languageSelector": LanguageSelectorLabels;
  "ui.localizedString": LocalizedStringLabels;
  "ui.meetingConfig": MeetingConfigLabels;
  "ui.meetingConfig.manager": MeetingConfigManagerLabels;
  "ui.meetingConfig.classScope": MeetingConfigClassScopeLabels;
  "ui.meetingConfig.display": MeetingConfigDisplayLabels;
  "ui.meetingConfig.summary": MeetingConfigSummaryLabels;
  "ui.meetingConfig.fields": MeetingConfigFieldsLabels;
  "ui.meetingConfig.join": MeetingConfigJoinLabels;
  "ui.meetingConfig.providerSelect": MeetingConfigProviderSelectLabels;
  "ui.meetingConfig.recurringSchedule": MeetingConfigRecurringScheduleLabels;
  "ui.paymentMethod": PaymentMethodLabels;
  "ui.paymentMethod.manager": PaymentMethodManagerLabels;
  "ui.paymentMethod.display": PaymentMethodDisplayLabels;
  "ui.paymentMethod.list": PaymentMethodListLabels;
  "ui.paymentMethod.typeSelector": PaymentMethodTypeSelectorLabels;
  "ui.paymentMethod.typeFields": PaymentMethodTypeFieldsLabels;
  "ui.paymentMethod.defaultsEditor": PaymentMethodDefaultsEditorLabels;
  "ui.phoneInput": PhoneInputLabels;
  "ui.tagInput": TagInputLabels;
  "ui.timezoneSelect": TimezoneSelectLabels;
};
