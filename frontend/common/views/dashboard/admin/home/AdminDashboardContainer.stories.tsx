import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useMemo, useState } from "react";
import { useDashboardStore } from "@/frontend/common/stores/dashboardStore";
import { isAdminMetricKey } from "@/frontend/common/views/dashboard/admin/__shared__/adminDashboardView";
import { withAdminDashboardStore } from "@/frontend/common/views/dashboard/admin/home/adminDashboardStoriesDecorator";
import { buildAdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardLabels";
import { buildAdminDashboardMetrics } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardMetrics";
import {
  matchesDailyScheduleMetricFilter,
  resolveDailyScheduleMetricFilter,
} from "@/frontend/common/views/dashboard/admin/home/utils/dailyScheduleMetricFilter";
import { AdminDashboardDesktopView } from "@/frontend/desktop/views/dashboard/admin/home/adminDashboard.desktop";
import { computeDailyScheduleMetricsFromRows } from "@/shared/lib/schedule/schedule-instance-dashboard-status";
import { Translation, useAppTranslation } from "@/shared/locale";

function noopSubmit() {}

export function MockAdminDashboardContainer() {
  const labels = useAppTranslation(Translation.Dashboard.Admin);
  const labelsBySection = useMemo(() => buildAdminDashboardLabelsBySection(labels), [labels]);

  const lastUpdatedKey = useDashboardStore(state => state.lastUpdated);
  const filters = useDashboardStore(state => state.filters);
  const scheduleRows = useDashboardStore(state => state.scheduleRows);
  const setDateFilter = useDashboardStore(state => state.setDateFilter);
  const setTeacherFilter = useDashboardStore(state => state.setTeacherFilter);
  const setSearchQuery = useDashboardStore(state => state.setSearchQuery);
  const setSelectedStatus = useDashboardStore(state => state.setSelectedStatus);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const cleanedLastUpdatedKey = lastUpdatedKey.startsWith("dashboard.")
    ? lastUpdatedKey.replace("dashboard.", "")
    : lastUpdatedKey;
  const translatedLastUpdated = labels.updatedMinutesAgo(Number(cleanedLastUpdatedKey));

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

  const selectedMetricLabel = filters.selectedStatus ? labelsBySection.metrics[filters.selectedStatus] : null;

  const handleMetricClick = (key: string) => {
    setPage(0);
    if (filters.selectedStatus === key) {
      setSelectedStatus(null);
    } else if (isAdminMetricKey(key)) {
      setSelectedStatus(key);
    }
  };

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  return (
    <AdminDashboardDesktopView
      labelsBySection={labelsBySection}
      loading={false}
      lastUpdated={translatedLastUpdated}
      metrics={metrics}
      onMetricClick={handleMetricClick}
      selectedMetricKey={filters.selectedStatus ?? undefined}
      selectedMetricLabel={selectedMetricLabel}
      searchValue={filters.searchQuery}
      dateValue={filters.date}
      selectedTeacher={filters.selectedTeacher}
      rows={paginatedRows}
      page={page}
      totalCount={filteredRows.length}
      onPageChange={setPage}
      onSearchChange={setSearchQuery}
      onDateChange={setDateFilter}
      onTeacherChange={setTeacherFilter}
      onSubmit={noopSubmit}
      pageSize={pageSize}
      pageCount={pageCount}
      canDashboardSearch
      canScheduleFilterAdvanced
      canScheduleViewTimezones
    />
  );
}

const meta: Meta<typeof MockAdminDashboardContainer> = {
  title: "Views/dashboard/dashboard/AdminDashboardContainer",
  component: MockAdminDashboardContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // The story renders a mock container component, so the static source panel would dump
    // the whole component body; keep the docs snippet at the usage level instead.
    docs: {
      source: {
        code: "<MockAdminDashboardContainer />",
        language: "tsx",
      },
    },
  },
  decorators: [withAdminDashboardStore],
};

export default meta;
type Story = StoryObj<typeof MockAdminDashboardContainer>;

export const Default: Story = {
  args: {},
};
