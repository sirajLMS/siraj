import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useDashboardStore } from "@/frontend/stores/dashboardStore";
import type { AdminMetricKey } from "@/frontend/types/shared.types";
import { useAdminDashboardLabels } from "@/frontend/views/dashboard/admin/home/utils";
import { buildAdminDashboardMetrics } from "@/frontend/views/dashboard/admin/home/utils/adminDashboardMetrics";
import { buildAdminDashboardViewLabels } from "@/frontend/views/dashboard/admin/home/utils/adminDashboardViewLabels";
import {
  matchesDailyScheduleMetricFilter,
  resolveDailyScheduleMetricFilter,
} from "@/frontend/views/dashboard/admin/home/utils/dailyScheduleMetricFilter";
import { DashboardView } from "@/frontend/views/dashboard/dashboard/DashboardView";
import { computeDailyScheduleMetricsFromRows } from "@/shared/lib/schedule/schedule-instance-dashboard-status";
import { MOCK_SCHEDULE, MOCK_TEACHERS } from "@/test/ui/components/fixtures/adminDashboardFixtures";

export function MockAdminDashboardContainer() {
  const t = useTranslations("dashboard");

  const { headers, statusLabels } = useAdminDashboardLabels();

  const lastUpdatedKey = useDashboardStore(state => state.lastUpdated);
  const filters = useDashboardStore(state => state.filters);
  const scheduleRows = useDashboardStore(state => state.scheduleRows);
  const teachers = useDashboardStore(state => state.teachers);
  const setDateFilter = useDashboardStore(state => state.setDateFilter);
  const setTeacherFilter = useDashboardStore(state => state.setTeacherFilter);
  const setSearchQuery = useDashboardStore(state => state.setSearchQuery);
  const setSelectedStatus = useDashboardStore(state => state.setSelectedStatus);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const handleSubmit = () => {};

  const cleanedLastUpdatedKey = lastUpdatedKey.startsWith("dashboard.")
    ? lastUpdatedKey.replace("dashboard.", "")
    : lastUpdatedKey;
  const translatedLastUpdated = t(cleanedLastUpdatedKey);

  const metricFilter = resolveDailyScheduleMetricFilter(filters.selectedStatus);

  const baseRows = useMemo(
    () =>
      scheduleRows.filter(row => {
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          const studentMatch = (row.student?.name ?? "").toLowerCase().includes(query);
          const classIdMatch = (row.id ?? "").toLowerCase().includes(query);
          if (!studentMatch && !classIdMatch) {
            return false;
          }
        }

        if (filters.teacherId) {
          const teacherId = filters.teacherId.toLowerCase();
          const teacherName = (row.teacher?.name ?? "").toLowerCase();
          const nameParts = teacherId.split("-");
          const matchesTeacher = nameParts.some(part => teacherName.includes(part));
          if (!matchesTeacher) {
            return false;
          }
        }

        return true;
      }),
    [filters.searchQuery, filters.teacherId, scheduleRows]
  );

  const metrics = useMemo(
    () =>
      buildAdminDashboardMetrics({
        id: "metrics-mock",
        ...computeDailyScheduleMetricsFromRows(baseRows),
      }),
    [baseRows]
  );

  const filteredRows = baseRows.filter(row => matchesDailyScheduleMetricFilter(row, metricFilter));

  const paginatedRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

  const selectedMetricLabel = filters.selectedStatus
    ? t(`admin.metrics.${filters.selectedStatus}` as `admin.metrics.${AdminMetricKey}`)
    : null;

  const handleMetricClick = (key: string) => {
    setPage(0);
    if (filters.selectedStatus === key) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(key as AdminMetricKey);
    }
  };

  const viewLabels = buildAdminDashboardViewLabels(t);

  return (
    <DashboardView
      todayClassesTitle={viewLabels.todayClassesTitle}
      lastUpdated={translatedLastUpdated}
      metrics={metrics}
      onMetricClick={handleMetricClick}
      selectedMetricKey={filters.selectedStatus ?? undefined}
      scheduleTitle={viewLabels.scheduleTitle}
      selectedMetricLabel={selectedMetricLabel}
      todayLabel={viewLabels.todayLabel}
      previousDayLabel={viewLabels.previousDayLabel}
      nextDayLabel={viewLabels.nextDayLabel}
      searchPlaceholder={viewLabels.searchPlaceholder}
      searchValue={filters.searchQuery}
      dateLabel={viewLabels.dateLabel}
      dateValue={filters.date}
      teacherPlaceholder={viewLabels.teacherPlaceholder}
      teacherValue={filters.teacherId}
      submitLabel={viewLabels.submitLabel}
      teachers={teachers}
      rows={paginatedRows}
      headers={headers}
      statusLabels={statusLabels}
      detailsLabel={viewLabels.detailsLabel}
      emptyMessage={viewLabels.emptyMessage}
      page={page}
      pageSize={pageSize}
      totalCount={filteredRows.length}
      onPageChange={setPage}
      onSearchChange={setSearchQuery}
      onDateChange={setDateFilter}
      onTeacherChange={setTeacherFilter}
      onSubmit={handleSubmit}
    />
  );
}

const meta: Meta<typeof MockAdminDashboardContainer> = {
  title: "Views/dashboard/dashboard/AdminDashboardContainer",
  component: MockAdminDashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    Story => {
      const MOCK_METRICS = buildAdminDashboardMetrics({
        id: "metrics-mock",
        ...computeDailyScheduleMetricsFromRows(MOCK_SCHEDULE),
      });
      useDashboardStore.setState({
        todayClasses: MOCK_METRICS,
        lastUpdated: "dashboard.admin.updatedMinutesAgo",
        scheduleRows: MOCK_SCHEDULE,
        teachers: MOCK_TEACHERS,
      });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof MockAdminDashboardContainer>;

export const Default: Story = {
  args: {},
};
