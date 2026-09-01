import type {
  ScheduleOverviewDataHeaders,
  ScheduleOverviewDataStatusLabels,
} from "@/frontend/common/views/dashboard/types/dashboard";
import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";

type AdminDashboardShellLabels = Pick<
  AdminDashboardLabels,
  "todayClasses" | "scheduleOverview" | "searchPlaceholder" | "noClasses" | "details" | "loading"
>;

type AdminDashboardFilterLabels = Pick<
  AdminDashboardLabels,
  "listOfClassesOn" | "today" | "previousDay" | "nextDay" | "selectTeacher" | "submit"
>;

type AdminDashboardColumnLabels = ScheduleOverviewDataHeaders;

type AdminDashboardMetricsLabels = AdminDashboardLabels["metrics"];

export type AdminDashboardLastUpdatedLabels = Pick<AdminDashboardLabels, "updatedJustNow" | "updatedMinutesAgo">;

export interface AdminDashboardLabelsBySection {
  readonly shell: AdminDashboardShellLabels;
  readonly filters: AdminDashboardFilterLabels;
  readonly columns: AdminDashboardColumnLabels;
  readonly status: ScheduleOverviewDataStatusLabels;
  readonly metrics: AdminDashboardMetricsLabels;
}
