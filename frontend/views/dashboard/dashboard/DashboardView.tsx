"use client";

import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { MetricItem, ScheduleOverviewData } from "@/frontend/views/dashboard/types/dashboard";
import { ScheduleOverviewSection } from "./components/ScheduleOverviewSection";
import { TodayClassesSection } from "./components/TodayClassesSection";

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
  showingText,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onSearchChange,
  onDateChange,
  onTeacherChange,
  onSubmit,
}: AdminDashboardViewProps) {
  return (
    <PageContainer>
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
        <ScheduleOverviewSection
          title={scheduleTitle}
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
          showingText={showingText}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onSearchChange={onSearchChange}
          onDateChange={onDateChange}
          onTeacherChange={onTeacherChange}
          onSubmit={onSubmit}
        />
      </RequirePermission>
    </PageContainer>
  );
}
