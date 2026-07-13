"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PageContainer } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TodayClassesSection } from "@/frontend/views/dashboard/admin/home/components/TodayClassesSection";
import { ScheduleOverviewView } from "@/frontend/views/dashboard/admin/home/scheduleOverview/scheduleOverviewView";
import type { MetricItem, ScheduleOverviewData } from "@/frontend/views/dashboard/types/dashboard";

interface AdminDashboardViewProps extends ScheduleOverviewData {
  readonly todayClassesTitle: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;
  readonly selectedMetricKey?: string;

  readonly scheduleTitle: string;
}

// Admin Dashboard View - composed of two permission-gated sections:
// 1. TodayClassesSection: metric cards showing class statistics for the day
// 2. ScheduleOverviewSection: filterable data grid/card list of scheduled classes
export function DashboardView({
  todayClassesTitle,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
  scheduleTitle,
  selectedMetricLabel,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  searchPlaceholder,
  searchValue,
  dateLabel,
  dateValue,
  teacherPlaceholder,
  teacherValue,
  submitLabel,
  teachers,
  rows,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onSearchChange,
  onDateChange,
  onTeacherChange,
  onSubmit,
  loading,
}: AdminDashboardViewProps) {
  return (
    <PageContainer sx={{ gap: { xs: 0, md: undefined } }}>
      {/* Today's Classes Section - metric cards with click-to-filter, requires DashboardViewMetrics permission */}
      <RequirePermission permissions={[AppPermission.DashboardViewMetrics]}>
        <TodayClassesSection
          title={todayClassesTitle}
          lastUpdated={lastUpdated}
          metrics={metrics}
          onMetricClick={onMetricClick}
          selectedMetricKey={selectedMetricKey}
        />
      </RequirePermission>

      {/* Schedule Overview Section - desktop data grid or mobile card list with filters and search, requires ScheduleViewList permission */}
      <RequirePermission permissions={[AppPermission.ScheduleViewList]}>
        <ScheduleOverviewView
          title={scheduleTitle}
          selectedMetricLabel={selectedMetricLabel}
          todayLabel={todayLabel}
          previousDayLabel={previousDayLabel}
          nextDayLabel={nextDayLabel}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          dateLabel={dateLabel}
          dateValue={dateValue}
          teacherPlaceholder={teacherPlaceholder}
          teacherValue={teacherValue}
          submitLabel={submitLabel}
          teachers={teachers}
          rows={rows}
          headers={headers}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          emptyMessage={emptyMessage}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onSearchChange={onSearchChange}
          onDateChange={onDateChange}
          onTeacherChange={onTeacherChange}
          onSubmit={onSubmit}
          loading={loading}
        />
      </RequirePermission>
    </PageContainer>
  );
}
