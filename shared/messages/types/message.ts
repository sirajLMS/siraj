import type { AuthLabels } from "./auth";
import type { CommonLabels } from "./common";
import type {
  AdminDashboardLabels,
  AdminViewLabels,
  ClassDetailsPerformanceLabels,
  DstMigrationLabels,
} from "./dashboard/admin";
import type { BillingLabels } from "./dashboard/billing";
import type {
  ClassAuditLabels,
  ClassDetailsLabels,
  CreateRecurringClassLabels,
  RescheduleFormLabels,
  RescheduleTrackingLabels,
} from "./dashboard/classes";
import type { ComplaintsLabels } from "./dashboard/complaints";
import type {
  DashboardLayoutLabels,
  DashboardNavigationLabels,
  NotificationsLabels,
  ParentDashboardLabels,
  ScheduleAlertsLabels,
  SearchScheduleLabels,
  StatusTrackingLabels,
} from "./dashboard/core";

import type { ManagerOnboardingLabels, ManagersDirectoryLabels } from "./dashboard/managers";
import type { ParentOnboardingLabels, ParentProfileLabels, ParentsDirectoryLabels } from "./dashboard/parents";
import type { PermissionsLabels } from "./dashboard/permissions";
import type { ReportsLabels } from "./dashboard/reports";
import type { BooksAndBagsLabels, ResourcesLabels } from "./dashboard/resources";
import type {
  StudentDirectoryLabels,
  StudentHistoryLabels,
  StudentQuotaLabels,
  StudentStatusLabels,
} from "./dashboard/students";
import type { SubjectsLabels } from "./dashboard/subjects";
import type { SuggestionsLabels } from "./dashboard/suggestions";
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
} from "./dashboard/teachers";
import type { ErrorsLabels } from "./errors";
import type { ProfileLabels } from "./profile";
import type { SessionLabels } from "./session";
import type { UiLabels } from "./ui";

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
  DashboardLayoutLabels,
  DashboardNavigationLabels,
  DstMigrationLabels,
  ManagerOnboardingLabels,
  ManagersDirectoryLabels,
  ParentDashboardLabels,
  ParentOnboardingLabels,
  ParentProfileLabels,
  ParentsDirectoryLabels,
  ReportsLabels,
  RescheduleFormLabels,
  RescheduleTrackingLabels,
  ResourcesLabels,
  ScheduleAlertsLabels,
  StudentDirectoryLabels,
  StudentHistoryLabels,
  StudentQuotaLabels,
  StudentStatusLabels,
  SubjectsLabels,
  SuggestionsLabels,
  TeacherAvailabilityLabels,
  TeacherCreateRecurringClassLabels,
  TeacherDashboardLabels,
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
    readonly teacherStudents: import("./dashboard/teachers/students").TeacherStudentsLabels;
    readonly parentStudents: import("./dashboard/parents/students").ParentStudentsLabels;
    readonly parentSocial: import("./dashboard/parents/social").ParentSocialLabels;
    readonly parentRules: import("./dashboard/parents/rules").ParentRulesLabels;
    readonly teacherOwnProfile: import("./dashboard/teachers/own-profile").TeacherOwnProfileLabels;
    readonly teacherClassList: import("./dashboard/teachers/class-list").TeacherClassListLabels;
    readonly parentsDirectory: ParentsDirectoryLabels;
    readonly parentProfile: ParentProfileLabels;
    readonly managersDirectory: ManagersDirectoryLabels;
    readonly parentOnboarding: ParentOnboardingLabels;
    readonly managerOnboarding: ManagerOnboardingLabels;
    readonly rescheduleForm: RescheduleFormLabels;
    readonly dstMigration: DstMigrationLabels;
    readonly parentDashboard: ParentDashboardLabels;
    readonly reports: ReportsLabels;
    readonly billing: BillingLabels;
    readonly suggestions: SuggestionsLabels;
    readonly complaints: ComplaintsLabels;
    readonly resources: ResourcesLabels;
    readonly subjects: SubjectsLabels;
    readonly booksAndBags: BooksAndBagsLabels;
    readonly permissions: PermissionsLabels;
    readonly searchSchedule: SearchScheduleLabels;
  };
};
