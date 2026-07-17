"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TodayClassesSection } from "@/frontend/common/views/dashboard/admin/home/components/TodayClassesSection";
import { ScheduleOverviewView } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/scheduleOverviewView";
import type { DashboardViewModel } from "@/frontend/common/views/dashboard/dashboard/useDashboardViewModel";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page/MobilePageContainer";

export function DashboardMobileView({
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
}: Readonly<DashboardViewModel>) {
  return (
    <MobilePageContainer sx={{ gap: { xs: 0, md: undefined } }}>
      <RequirePermission permissions={[AppPermission.DashboardViewMetrics]}>
        <TodayClassesSection
          title={todayClassesTitle}
          lastUpdated={lastUpdated}
          metrics={metrics}
          onMetricClick={onMetricClick}
          selectedMetricKey={selectedMetricKey}
        />
      </RequirePermission>

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
    </MobilePageContainer>
  );
}
