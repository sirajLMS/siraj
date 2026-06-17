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
  ParentDashboardLabels,
  ScheduleAlertsLabels,
  StatusTrackingLabels,
} from "./dashboard/core";
import type { ManagerOnboardingLabels, ManagersDirectoryLabels } from "./dashboard/managers";
import type { ParentOnboardingLabels, ParentProfileLabels, ParentsDirectoryLabels } from "./dashboard/parents";
import type { ReportsLabels } from "./dashboard/reports";
import type { ResourcesLabels } from "./dashboard/resources";
import type {
  StudentDirectoryLabels,
  StudentHistoryLabels,
  StudentQuotaLabels,
  StudentStatusLabels,
} from "./dashboard/students";
import type { SuggestionsLabels } from "./dashboard/suggestions";
import type {
  TeacherAvailabilityLabels,
  TeacherDashboardLabels,
  TeacherFutureScheduleLabels,
  TeacherOnboardingLabels,
  TeacherProfileLabels,
  TeacherReassignmentLabels,
  TeachersDirectoryLabels,
  TeacherWeeklyScheduleLabels,
} from "./dashboard/teachers";
import type { ErrorsLabels } from "./errors";

export type {
  AdminDashboardLabels,
  AdminViewLabels,
  BillingLabels,
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
  SuggestionsLabels,
  TeacherAvailabilityLabels,
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
  dashboard: {
    readonly nav: DashboardNavigationLabels;
    readonly layout: DashboardLayoutLabels;
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
    readonly teacherAvailability: TeacherAvailabilityLabels;
    readonly teacherWeeklySchedule: TeacherWeeklyScheduleLabels;
    readonly teacherFutureSchedule: TeacherFutureScheduleLabels;
    readonly teacherReassignment: TeacherReassignmentLabels;
    readonly teacherOnboarding: TeacherOnboardingLabels;
    readonly teacherDashboard: TeacherDashboardLabels;
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
  };
};
