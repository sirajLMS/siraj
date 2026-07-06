import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import { useDashboardStore } from "@/frontend/stores/dashboardStore";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/admin/dashboard/types/schedule";
import type { TeacherFilterItem } from "@/frontend/views/dashboard/types/dashboard";
import { computeDailyScheduleMetricsFromRows } from "@/shared/lib/schedule-instance-dashboard-status";
import { DashboardView } from "../dashboard/DashboardView";
import { useAdminDashboardLabels } from "./dashboard/utils";
import { buildAdminDashboardMetrics } from "./dashboard/utils/adminDashboardMetrics";
import {
  matchesDailyScheduleMetricFilter,
  resolveDailyScheduleMetricFilter,
} from "./dashboard/utils/dailyScheduleMetricFilter";

const MOCK_TEACHERS: TeacherFilterItem[] = [
  { id: "teacher-ahmed", name: "Ahmed Mohammed" },
  { id: "teacher-sarah", name: "Sarah Johnson" },
];

const MOCK_SCHEDULE: DailyScheduleRow[] = [
  {
    id: "9082",
    yourTime: "10:00 AM - 11:00 AM",
    teacherTime: "11:00 AM - 12:00 PM",
    studentTime: "10:00 AM - 11:00 AM",
    duration: 60,
    status: null,
    outcome: ClassOutcome.Pending,
    executionState: ClassExecutionState.NotActivated,
    student: { id: "student-1", name: "Omar Khalid" },
    teacher: { id: "teacher-ahmed", name: "Ahmed Mohammed" },
  },
  {
    id: "9083",
    yourTime: "11:30 AM - 12:30 PM",
    teacherTime: "12:30 PM - 01:30 PM",
    studentTime: "11:30 AM - 12:30 PM",
    duration: 60,
    status: null,
    outcome: ClassOutcome.Pending,
    executionState: ClassExecutionState.Running,
    student: { id: "student-2", name: "Layla Ismail" },
    teacher: { id: "teacher-sarah", name: "Sarah Johnson" },
  },
  {
    id: "9084",
    yourTime: "02:00 PM - 03:00 PM",
    teacherTime: "03:00 PM - 04:00 PM",
    studentTime: "02:00 PM - 03:00 PM",
    duration: 60,
    status: null,
    outcome: ClassOutcome.Taken,
    executionState: ClassExecutionState.Completed,
    student: { id: "student-3", name: "Omar Ahmed" },
    teacher: { id: "teacher-ahmed", name: "Ahmed Mohammed" },
  },
];

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
    ? t(`admin.metrics.${filters.selectedStatus}` as "admin.metrics.total")
    : null;

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
      selectedMetricLabel={selectedMetricLabel}
      todayLabel={t("admin.today")}
      previousDayLabel={t("admin.previousDay")}
      nextDayLabel={t("admin.nextDay")}
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
