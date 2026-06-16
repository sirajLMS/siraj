"use client";

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
      <TodayClassesSection
        title={todayClassesTitle}
        lastUpdated={lastUpdated}
        metrics={metrics}
        onMetricClick={onMetricClick}
      />

      {/* Schedule Overview Section */}
      <ScheduleOverviewSection
        title={scheduleTitle}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        dateLabel={dateLabel}
        dateValue={dateValue}
        teacherPlaceholder={teacherPlaceholder}
        teacherValue={teacherValue}
        submitLabel={submitLabel}
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
    </PageContainer>
  );
}
