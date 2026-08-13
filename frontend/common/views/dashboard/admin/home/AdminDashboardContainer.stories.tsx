import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useMemo, useState } from "react";
import { useDashboardStore } from "@/frontend/common/stores/dashboardStore";
import { isAdminMetricKey } from "@/frontend/common/views/dashboard/admin/__shared__/adminDashboardView";
import type { AdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import { buildAdminDashboardMetrics } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardMetrics";
import {
  matchesDailyScheduleMetricFilter,
  resolveDailyScheduleMetricFilter,
} from "@/frontend/common/views/dashboard/admin/home/utils/dailyScheduleMetricFilter";
import { buildClassInstanceStatusLabels } from "@/frontend/common/views/dashboard/utils/classInstanceStatusLabels";
import { AdminDashboardDesktopView } from "@/frontend/desktop/views/dashboard/admin/home/adminDashboard.desktop";
import { computeDailyScheduleMetricsFromRows } from "@/shared/lib/schedule/schedule-instance-dashboard-status";
import { type AdminDashboardLabels, Translation, useAppTranslation } from "@/shared/locale";
import { MOCK_SCHEDULE, MOCK_TEACHERS } from "@/test/ui/components/fixtures/adminDashboardFixtures";

function noopSubmit() {}

function buildLabelsBySection(labels: AdminDashboardLabels): AdminDashboardLabelsBySection {
  return {
    shell: {
      todayClasses: labels.todayClasses,
      scheduleOverview: labels.scheduleOverview,
      searchPlaceholder: labels.searchPlaceholder,
      noClasses: labels.noClasses,
      details: labels.details,
      loading: labels.loading,
    },
    filters: {
      listOfClassesOn: labels.listOfClassesOn,
      today: labels.today,
      previousDay: labels.previousDay,
      nextDay: labels.nextDay,
      selectTeacher: labels.selectTeacher,
      submit: labels.submit,
    },
    columns: {
      className: labels.className,
      student: labels.student,
      teacher: labels.teacher,
      time: labels.time,
      yourTime: labels.yourTime,
      teacherTime: labels.teacherTime,
      studentTime: labels.studentTime,
      duration: labels.duration,
      status: labels.status,
      actions: labels.actions,
      history: labels.history,
      joinVideo: labels.joinVideo,
    },
    status: buildClassInstanceStatusLabels(labels.statusLabels),
    metrics: labels.metrics,
  };
}

export function MockAdminDashboardContainer() {
  const labels = useAppTranslation(Translation.Dashboard.Admin);
  const labelsBySection = useMemo(() => buildLabelsBySection(labels), [labels]);

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
