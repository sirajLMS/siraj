"use client";

import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer } from "@/frontend/components/ui";
import type { MetricItem, ScheduleOverviewData } from "@/frontend/views/dashboard/types/dashboard";
import { ScheduleOverviewSection } from "./components/ScheduleOverviewSection";
import { TodayClassesSection } from "./components/TodayClassesSection";

interface AdminDashboardViewProps extends ScheduleOverviewData {
  readonly todayClassesTitle: string;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick?: (key: string) => void;

  readonly scheduleTitle: string;
}

export function DashboardView({
  todayClassesTitle,
  lastUpdated,
  metrics,
  onMetricClick,
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
  onSearchChange,
  onDateChange,
  onTeacherChange,
  onSubmit,
}: AdminDashboardViewProps) {
  return (
    <PageContainer>
      {/* Today Classes Section */}
      <RequirePermission permissions={["dashboard.view_metrics"]}>
        <TodayClassesSection
          title={todayClassesTitle}
          lastUpdated={lastUpdated}
          metrics={metrics}
          onMetricClick={onMetricClick}
        />
      </RequirePermission>

      {/* Schedule Overview Section */}
      <RequirePermission permissions={["schedule.view_list"]}>
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
          onSearchChange={onSearchChange}
          onDateChange={onDateChange}
          onTeacherChange={onTeacherChange}
          onSubmit={onSubmit}
        />
      </RequirePermission>
    </PageContainer>
  );
}
