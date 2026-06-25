import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useMockDashboardStore } from "@/frontend/stores/mockDashboardStore";
import { computeDailyScheduleMetricsFromRows } from "@/shared/lib/schedule-instance-dashboard-status";
import { DashboardView } from "./DashboardView";
import { useAdminDashboardLabels } from "./utils";
import { buildAdminDashboardMetrics } from "./utils/adminDashboardMetrics";
import {
  matchesDailyScheduleMetricFilter,
  resolveDailyScheduleMetricFilter,
} from "./utils/dailyScheduleMetricFilter";

// Reusable mock container that acts exactly like the old AdminDashboardContainer
export function MockAdminDashboardContainer() {
  const t = useTranslations("dashboard");

  const { headers, statusLabels } = useAdminDashboardLabels();

  const lastUpdatedKey = useMockDashboardStore(state => state.lastUpdated);
  const filters = useMockDashboardStore(state => state.filters);
  const scheduleRows = useMockDashboardStore(state => state.scheduleRows);
  const teachers = useMockDashboardStore(state => state.teachers);
  const setDateFilter = useMockDashboardStore(state => state.setDateFilter);
  const setTeacherFilter = useMockDashboardStore(state => state.setTeacherFilter);
  const setSearchQuery = useMockDashboardStore(state => state.setSearchQuery);
  const setSelectedStatus = useMockDashboardStore(state => state.setSelectedStatus);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const handleSubmit = () => {
    // Placeholder for story submit
  };

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

  const showingText = t("admin.showingOf", {
    shown: paginatedRows.length,
    total: filteredRows.length,
  });

  const handleMetricClick = (key: string) => {
    setPage(0);
    if (filters.selectedStatus === key) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(key);
    }
  };

  return (
    <DashboardView
      todayClassesTitle={t("admin.todayClasses")}
      lastUpdated={translatedLastUpdated}
      metrics={metrics}
      onMetricClick={handleMetricClick}
      selectedMetricKey={filters.selectedStatus ?? undefined}
      scheduleTitle={t("admin.scheduleOverview")}
      searchPlaceholder={t("admin.searchPlaceholder")}
      searchValue={filters.searchQuery}
      dateLabel={t("admin.listOfClassesOn")}
      dateValue={filters.date}
      teacherPlaceholder={t("admin.selectTeacher")}
      teacherValue={filters.teacherId}
      submitLabel={t("admin.submit")}
      teachers={teachers}
      rows={paginatedRows}
      headers={headers}
      statusLabels={statusLabels}
      detailsLabel={t("admin.details")}
      emptyMessage={t("admin.noClasses")}
      showingText={showingText}
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
};

export default meta;
type Story = StoryObj<typeof MockAdminDashboardContainer>;

export const Default: Story = {
  args: {},
};
