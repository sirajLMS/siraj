import type { AuthLabels } from "@/shared/messages/types/auth";
import type { CommonLabels } from "@/shared/messages/types/common";
import type {
  AdminDashboardLabels,
  AdminViewLabels,
  ClassDetailsPerformanceLabels,
  DstMigrationLabels,
} from "@/shared/messages/types/dashboard/admin";
import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";
import type {
  ClassAuditLabels,
  ClassDetailsLabels,
  CreateRecurringClassLabels,
  RescheduleFormLabels,
  RescheduleTrackingLabels,
} from "@/shared/messages/types/dashboard/classes";
import type { ComplaintsLabels } from "@/shared/messages/types/dashboard/complaints";
import type {
  DashboardLayoutLabels,
  DashboardNavigationLabels,
  NotificationsLabels,
  ParentDashboardLabels,
  ScheduleAlertsLabels,
  SearchScheduleLabels,
  StatusTrackingLabels,
} from "@/shared/messages/types/dashboard/core";
import type {
  CreditLabels,
  LessonReportLabels,
  MonthlyReportLabels,
  TeacherDueLabels,
} from "@/shared/messages/types/dashboard/lms";
import type { ManagerOnboardingLabels, ManagersDirectoryLabels } from "@/shared/messages/types/dashboard/managers";
import type { MeetingProvidersLabels } from "@/shared/messages/types/dashboard/meeting-providers";
import type {
  ParentLifecycleLabels,
  ParentOnboardingLabels,
  ParentProfileLabels,
  ParentsDirectoryLabels,
} from "@/shared/messages/types/dashboard/parents";
import type { PaymentCatalogsLabels } from "@/shared/messages/types/dashboard/payment-catalogs";
import type { PermissionsLabels } from "@/shared/messages/types/dashboard/permissions";
import type { ReportsLabels } from "@/shared/messages/types/dashboard/reports";
import type { BooksAndBagsLabels, ResourcesLabels } from "@/shared/messages/types/dashboard/resources";
import type { StudentCreditsLabels, StudentDashboardLabels } from "@/shared/messages/types/dashboard/studentPortal";
import type {
  StudentDirectoryLabels,
  StudentHistoryLabels,
  StudentOnboardingLabels,
  StudentQuotaLabels,
  StudentStatusLabels,
} from "@/shared/messages/types/dashboard/students";
import type { SubjectsLabels } from "@/shared/messages/types/dashboard/subjects";
import type { SuggestionsLabels } from "@/shared/messages/types/dashboard/suggestions";
import type {
  PendingReviewsLabels,
  SupervisorDashboardLabels,
  SupervisorMonthlyReportsLabels,
  SupervisorTeacherDuesLabels,
} from "@/shared/messages/types/dashboard/supervisorPortal";
import type {
  TeacherAvailabilityLabels,
  TeacherCreateRecurringClassLabels,
  TeacherDashboardLabels,
  TeacherFutureScheduleLabels,
  TeacherOnboardingLabels,
  TeacherProfileLabels,
  TeacherReassignmentLabels,
  TeachersDirectoryLabels,
  TeacherWeeklyScheduleLabels,
} from "@/shared/messages/types/dashboard/teachers";
import type { ErrorsLabels } from "@/shared/messages/types/errors";
import type { ProfileLabels } from "@/shared/messages/types/profile";
import type { SessionLabels } from "@/shared/messages/types/session";
import type { UiLabels } from "@/shared/messages/types/ui";

export type {
  AdminDashboardLabels,
  AdminViewLabels,
  BillingLabels,
  BooksAndBagsLabels,
  ClassAuditLabels,
  ClassDetailsLabels,
  ClassDetailsPerformanceLabels,
  ComplaintsLabels,
  CreateRecurringClassLabels,
  CreditLabels,
  DashboardLayoutLabels,
  DashboardNavigationLabels,
  DstMigrationLabels,
  LessonReportLabels,
  ManagerOnboardingLabels,
  ManagersDirectoryLabels,
  MeetingProvidersLabels,
  MonthlyReportLabels,
  ParentDashboardLabels,
  ParentLifecycleLabels,
  ParentOnboardingLabels,
  ParentProfileLabels,
  ParentsDirectoryLabels,
  PendingReviewsLabels,
  ReportsLabels,
  RescheduleFormLabels,
  RescheduleTrackingLabels,
  ResourcesLabels,
  ScheduleAlertsLabels,
  StudentCreditsLabels,
  StudentDashboardLabels,
  StudentDirectoryLabels,
  StudentHistoryLabels,
  StudentOnboardingLabels,
  StudentQuotaLabels,
  StudentStatusLabels,
  SubjectsLabels,
  SuggestionsLabels,
  SupervisorDashboardLabels,
  SupervisorMonthlyReportsLabels,
  SupervisorTeacherDuesLabels,
  TeacherAvailabilityLabels,
  TeacherCreateRecurringClassLabels,
  TeacherDashboardLabels,
  TeacherDueLabels,
  TeacherFutureScheduleLabels,
  TeacherOnboardingLabels,
  TeacherProfileLabels,
  TeacherReassignmentLabels,
  TeachersDirectoryLabels,
  TeacherWeeklyScheduleLabels,
};

export type MessageSchema = {
  common: CommonLabels;
  auth: AuthLabels;
  errors: ErrorsLabels;
  profile: ProfileLabels;
  session: SessionLabels;
  ui: UiLabels;
  dashboard: {
    readonly nav: DashboardNavigationLabels;
    readonly layout: DashboardLayoutLabels;
    readonly notifications: NotificationsLabels;
    readonly statusTracking: StatusTrackingLabels;
    readonly teacherProfile: TeacherProfileLabels;
    readonly teachersDirectory: TeachersDirectoryLabels;
    readonly studentStatus: StudentStatusLabels;
    readonly studentQuota: StudentQuotaLabels;
    readonly studentProfile: import("@/shared/messages/types/dashboard/students/profile").StudentProfileLabels;
    readonly studentHistory: StudentHistoryLabels;
    readonly studentDirectory: StudentDirectoryLabels;
    readonly rescheduleTracking: RescheduleTrackingLabels;
    readonly scheduleAlerts: ScheduleAlertsLabels;
    readonly admin: AdminDashboardLabels;
    readonly classDetails: ClassDetailsLabels;
    readonly classAudit: ClassAuditLabels;
    readonly createRecurringClass: CreateRecurringClassLabels;
    readonly teacherCreateRecurringClass: TeacherCreateRecurringClassLabels;
    readonly teacherAvailability: TeacherAvailabilityLabels;
    readonly teacherWeeklySchedule: TeacherWeeklyScheduleLabels;
    readonly teacherFutureSchedule: TeacherFutureScheduleLabels;
    readonly teacherReassignment: TeacherReassignmentLabels;
    readonly teacherOnboarding: TeacherOnboardingLabels;
    readonly teacherDashboard: TeacherDashboardLabels;
    readonly teacherStudents: import("@/shared/messages/types/dashboard/teachers/students").TeacherStudentsLabels;
    readonly parentStudents: import("@/shared/messages/types/dashboard/parents/students").ParentStudentsLabels;
    readonly parentSocial: import("@/shared/messages/types/dashboard/parents/social").ParentSocialLabels;
    readonly parentRules: import("@/shared/messages/types/dashboard/parents/rules").ParentRulesLabels;
    readonly teacherOwnProfile: import("@/shared/messages/types/dashboard/teachers/own-profile").TeacherOwnProfileLabels;
    readonly teacherClassList: import("@/shared/messages/types/dashboard/teachers/class-list").TeacherClassListLabels;
    readonly parentsDirectory: ParentsDirectoryLabels;
    readonly parentLifecycle: ParentLifecycleLabels;
    readonly parentProfile: ParentProfileLabels;
    readonly managersDirectory: ManagersDirectoryLabels;
    readonly parentOnboarding: ParentOnboardingLabels;
    readonly managerOnboarding: ManagerOnboardingLabels;
    readonly studentOnboarding: StudentOnboardingLabels;
    readonly rescheduleForm: RescheduleFormLabels;
    readonly dstMigration: DstMigrationLabels;
    readonly parentDashboard: ParentDashboardLabels;
    readonly reports: ReportsLabels;
    readonly billing: BillingLabels;
    readonly suggestions: SuggestionsLabels;
    readonly complaints: ComplaintsLabels;
    readonly resources: ResourcesLabels;
    readonly subjects: SubjectsLabels;
    readonly meetingProviders: MeetingProvidersLabels;
    readonly paymentCatalogs: PaymentCatalogsLabels;
    readonly booksAndBags: BooksAndBagsLabels;
    readonly permissions: PermissionsLabels;
    readonly searchSchedule: SearchScheduleLabels;
    readonly lms: {
      readonly credit: CreditLabels;
      readonly lessonReports: LessonReportLabels;
      readonly teacherDues: TeacherDueLabels;
      readonly monthlyReports: MonthlyReportLabels;
    };
    readonly studentPortal: {
      readonly dashboard: StudentDashboardLabels;
      readonly credits: StudentCreditsLabels;
    };
    readonly supervisorPortal: {
      readonly dashboard: SupervisorDashboardLabels;
      readonly pendingReviews: PendingReviewsLabels;
      readonly teacherDues: SupervisorTeacherDuesLabels;
      readonly monthlyReports: SupervisorMonthlyReportsLabels;
    };
  };
};
