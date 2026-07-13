"use client";

import type { AdminMetricKey } from "@/frontend/common/types/shared.types";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { ADMIN_METRIC_DEFINITIONS } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardMetrics";
import { DashboardView } from "@/frontend/common/views/dashboard/dashboard/DashboardView";
import type {
  MetricItem,
  ScheduleOverviewData,
  TeacherFilterItem,
} from "@/frontend/common/views/dashboard/types/dashboard";

type DashboardTranslator = ReturnType<typeof import("next-intl").useTranslations>;
type DashboardHeaders = ScheduleOverviewData["headers"];
type DashboardStatusLabels = ScheduleOverviewData["statusLabels"];

/** Input shape for {@link renderAdminDashboardView}. */
export interface AdminDashboardViewInput {
  readonly t: DashboardTranslator;
  readonly loading: boolean;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick: (key: string) => void;
  readonly selectedMetricKey?: string | undefined;
  readonly selectedMetricLabel: string | null;
  readonly searchValue: string;
  readonly dateValue: string;
  readonly teacherValue: string;
  readonly teachers: readonly TeacherFilterItem[];
  readonly rows: readonly DailyScheduleRow[];
  readonly headers: DashboardHeaders;
  readonly statusLabels: DashboardStatusLabels;
  readonly page: number;
  readonly totalCount?: number | undefined;
  readonly onPageChange: (page: number) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: string) => void;
  readonly onSubmit: () => void;
  readonly pageSize?: number;
  readonly loadingLabel?: string;
  readonly emptyLabel?: string;
}

/** Type guard to ensure a value is a valid AdminMetricKey. */
export function isAdminMetricKey(key: string | null): key is AdminMetricKey {
  return ADMIN_METRIC_DEFINITIONS.some((def: { key: string }) => def.key === key);
}

/** Renders the admin DashboardView using translation keys and the provided data/handlers. */
export function renderAdminDashboardView(input: AdminDashboardViewInput) {
  const {
    t,
    loading,
    lastUpdated,
    metrics,
    onMetricClick,
    selectedMetricKey,
    selectedMetricLabel,
    searchValue,
    dateValue,
    teacherValue,
    teachers,
    rows,
    headers,
    statusLabels,
    page,
    totalCount,
    onPageChange,
    onSearchChange,
    onDateChange,
    onTeacherChange,
    onSubmit,
    pageSize = 10,
    loadingLabel = t("admin.loading"),
    emptyLabel = t("admin.noClasses"),
  } = input;

  return (
    <DashboardView
      loading={loading}
      todayClassesTitle={t("admin.todayClasses")}
      lastUpdated={lastUpdated}
      metrics={metrics}
      onMetricClick={onMetricClick}
      selectedMetricKey={selectedMetricKey}
      scheduleTitle={t("admin.scheduleOverview")}
      selectedMetricLabel={selectedMetricLabel}
      todayLabel={t("admin.today")}
      previousDayLabel={t("admin.previousDay")}
      nextDayLabel={t("admin.nextDay")}
      searchPlaceholder={t("admin.searchPlaceholder")}
      searchValue={searchValue}
      dateLabel={t("admin.listOfClassesOn")}
      dateValue={dateValue}
      teacherPlaceholder={t("admin.selectTeacher")}
      teacherValue={teacherValue}
      submitLabel={t("admin.submit")}
      teachers={teachers as readonly TeacherFilterItem[]}
      rows={rows as readonly DailyScheduleRow[]}
      headers={headers}
      statusLabels={statusLabels}
      detailsLabel={t("admin.details")}
      emptyMessage={loading ? loadingLabel : emptyLabel}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onSearchChange={onSearchChange}
      onDateChange={onDateChange}
      onTeacherChange={onTeacherChange}
      onSubmit={onSubmit}
    />
  );
}
