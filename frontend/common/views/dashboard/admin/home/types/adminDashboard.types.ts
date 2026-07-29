import type {
  ScheduleOverviewDataHeaders,
  ScheduleOverviewDataStatusLabels,
} from "@/frontend/common/views/dashboard/types/dashboard";
import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";

export type AdminDashboardShellLabels = Pick<
  AdminDashboardLabels,
  "todayClasses" | "scheduleOverview" | "searchPlaceholder" | "noClasses" | "details" | "loading"
>;

export type AdminDashboardFilterLabels = Pick<
  AdminDashboardLabels,
  "listOfClassesOn" | "today" | "previousDay" | "nextDay" | "selectTeacher" | "submit"
>;

export type AdminDashboardColumnLabels = ScheduleOverviewDataHeaders;

export type AdminDashboardMetricsLabels = AdminDashboardLabels["metrics"];

export type AdminDashboardLastUpdatedLabels = Pick<AdminDashboardLabels, "updatedJustNow" | "updatedMinutesAgo">;

export interface AdminDashboardLabelsBySection {
  readonly shell: AdminDashboardShellLabels;
  readonly filters: AdminDashboardFilterLabels;
  readonly columns: AdminDashboardColumnLabels;
  readonly status: ScheduleOverviewDataStatusLabels;
  readonly metrics: AdminDashboardMetricsLabels;
}
