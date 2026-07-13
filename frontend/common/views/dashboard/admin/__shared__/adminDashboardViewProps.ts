"use client";

import type { useTranslations } from "next-intl";
import type { AdminMetricKey, DashboardFilters, TeacherFilterItem } from "@/frontend/common/types/shared.types";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import {
  buildAdminDashboardMetrics,
  type RawMetrics,
} from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardMetrics";
import type { AdminDashboardViewLabels } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardViewLabels";

type TranslationFunction = ReturnType<typeof useTranslations<"dashboard">>;
type MetricItemList = ReturnType<typeof buildAdminDashboardMetrics>;

/** Summary derived from the admin dashboard schedule GraphQL response. */
export interface ScheduleSummary {
  readonly metricsList: MetricItemList;
  readonly rows: readonly DailyScheduleRow[];
  readonly totalCount: number | undefined;
}

interface ScheduleResultLike {
  readonly metrics: RawMetrics;
  readonly rows?: readonly unknown[] | null;
  readonly pageInfo?: { readonly total?: number | null } | null;
  readonly totalCount?: number | null;
}

/** Derives metric list, rows, and total count from the GraphQL schedule response. */
export function extractScheduleSummary(scheduleResult: ScheduleResultLike | null | undefined): ScheduleSummary {
  if (!scheduleResult) {
    return { metricsList: buildAdminDashboardMetrics(null), rows: [], totalCount: undefined };
  }
  const metricsList = buildAdminDashboardMetrics(scheduleResult.metrics);
  const rows = (scheduleResult.rows ?? []) as unknown as readonly DailyScheduleRow[];
  const totalCount = scheduleResult.pageInfo?.total ?? scheduleResult.totalCount ?? 0;
  return { metricsList, rows, totalCount };
}

/** Computes the selected metric label from the active filter status. */
export function buildSelectedMetricLabel(t: TranslationFunction, selectedStatus: AdminMetricKey | null): string | null {
  return selectedStatus ? t(`admin.metrics.${selectedStatus}` as `admin.metrics.${AdminMetricKey}`) : null;
}

export interface BuildAdminDashboardViewPropsParams {
  readonly t: TranslationFunction;
  readonly labels: AdminDashboardViewLabels;
  readonly filters: DashboardFilters;
  readonly loading: boolean;
  readonly lastUpdated: string;
  readonly teachers: readonly TeacherFilterItem[];
  readonly scheduleSummary: ScheduleSummary;
  readonly page: number;
  readonly pageSize: number;
  readonly setPage: (page: number) => void;
  readonly onMetricClick: (key: string) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: string) => void;
  readonly onSubmit: () => void;
  readonly headers: AdminDashboardLabelHeaders;
  readonly statusLabels: AdminDashboardLabelStatusLabels;
  readonly emptyMessageOverride?: string;
}

export type AdminDashboardLabelHeaders = {
  readonly student: string;
  readonly teacher: string;
  readonly time: string;
  readonly yourTime: string;
  readonly teacherTime: string;
  readonly studentTime: string;
  readonly duration: string;
  readonly status: string;
  readonly actions: string;
  readonly history: string;
  readonly joinVideo: string;
};

export type AdminDashboardLabelStatusLabels = Record<string, string>;

/** Builds all props for the DashboardView component from common admin dashboard parameters. */
export function buildAdminDashboardViewProps(params: BuildAdminDashboardViewPropsParams) {
  const emptyMessage =
    params.emptyMessageOverride ?? (params.loading ? params.labels.loadingLabel : params.labels.emptyMessage);

  return {
    loading: params.loading,
    todayClassesTitle: params.labels.todayClassesTitle,
    lastUpdated: params.lastUpdated,
    metrics: params.scheduleSummary.metricsList,
    onMetricClick: params.onMetricClick,
    selectedMetricKey: params.filters.selectedStatus ?? undefined,
    scheduleTitle: params.labels.scheduleTitle,
    selectedMetricLabel: buildSelectedMetricLabel(params.t, params.filters.selectedStatus),
    todayLabel: params.labels.todayLabel,
    previousDayLabel: params.labels.previousDayLabel,
    nextDayLabel: params.labels.nextDayLabel,
    searchPlaceholder: params.labels.searchPlaceholder,
    searchValue: params.filters.searchQuery,
    dateLabel: params.labels.dateLabel,
    dateValue: params.filters.date,
    teacherPlaceholder: params.labels.teacherPlaceholder,
    teacherValue: params.filters.teacherId,
    submitLabel: params.labels.submitLabel,
    teachers: params.teachers,
    rows: params.scheduleSummary.rows,
    headers: params.headers,
    statusLabels: params.statusLabels,
    detailsLabel: params.labels.detailsLabel,
    emptyMessage,
    page: params.page,
    pageSize: params.pageSize,
    totalCount: params.scheduleSummary.totalCount,
    onPageChange: params.setPage,
    onSearchChange: params.onSearchChange,
    onDateChange: params.onDateChange,
    onTeacherChange: params.onTeacherChange,
    onSubmit: params.onSubmit,
  };
}

export { ADMIN_DASHBOARD_PAGE_SIZE } from "@/frontend/common/views/dashboard/admin/__shared__/useAdminDashboard";
export type { AdminDashboardViewLabels } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardViewLabels";
export { buildAdminDashboardViewLabels } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardViewLabels";
