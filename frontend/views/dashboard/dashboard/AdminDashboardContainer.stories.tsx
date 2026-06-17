import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";
import { useMockDashboardStore } from "@/frontend/stores/mockDashboardStore";
import type { ClassStatus } from "@/frontend/views/dashboard/types/dashboard";
import { DashboardView } from "./DashboardView";

// Reusable mock container that acts exactly like the old AdminDashboardContainer
export function MockAdminDashboardContainer() {
  const t = useTranslations("dashboard");

  const todayClasses = useMockDashboardStore(state => state.todayClasses);
  const lastUpdatedKey = useMockDashboardStore(state => state.lastUpdated);
  const filters = useMockDashboardStore(state => state.filters);
  const scheduleRows = useMockDashboardStore(state => state.scheduleRows);
  const teachers = useMockDashboardStore(state => state.teachers);
  const setDateFilter = useMockDashboardStore(state => state.setDateFilter);
  const setTeacherFilter = useMockDashboardStore(state => state.setTeacherFilter);
  const setSearchQuery = useMockDashboardStore(state => state.setSearchQuery);

  const handleSubmit = () => {
    // Placeholder for story submit
  };

  const cleanedLastUpdatedKey = lastUpdatedKey.startsWith("dashboard.")
    ? lastUpdatedKey.replace("dashboard.", "")
    : lastUpdatedKey;
  const translatedLastUpdated = t(cleanedLastUpdatedKey);

  const filteredRows = scheduleRows.filter(row => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const studentMatch = row.student.toLowerCase().includes(query);
      const classIdMatch = row.classId.toLowerCase().includes(query);
      if (!studentMatch && !classIdMatch) {
        return false;
      }
    }

    if (filters.teacherId) {
      const teacherId = filters.teacherId.toLowerCase();
      const nameParts = teacherId.split("-");
      const matchesTeacher = nameParts.some(part => row.teacher.toLowerCase().includes(part));
      if (!matchesTeacher) {
        return false;
      }
    }

    return true;
  });

  const headers = {
    classId: t("admin.classId"),
    student: t("admin.student"),
    teacher: t("admin.teacher"),
    time: t("admin.time"),
    status: t("admin.status"),
    actions: t("admin.actions"),
  };

  const statusLabels: Record<ClassStatus, string> = {
    scheduled: t("admin.statusLabels.scheduled"),
    in_progress: t("admin.statusLabels.inProgress"),
    pending: t("admin.statusLabels.pending"),
    completed: t("admin.statusLabels.completed"),
    cancelled: t("admin.statusLabels.cancelled"),
    absent: t("admin.statusLabels.absent"),
  };

  const showingText = t("admin.showingOf", {
    shown: filteredRows.length,
    total: scheduleRows.length,
  });

  return (
    <DashboardView
      todayClassesTitle={t("admin.todayClasses")}
      lastUpdated={translatedLastUpdated}
      metrics={todayClasses}
      onMetricClick={_key => {}}
      scheduleTitle={t("admin.scheduleOverview")}
      searchPlaceholder={t("admin.searchPlaceholder")}
      searchValue={filters.searchQuery}
      dateLabel={t("admin.listOfClassesOn")}
      dateValue={filters.date}
      teacherPlaceholder={t("admin.selectTeacher")}
      teacherValue={filters.teacherId}
      submitLabel={t("admin.submit")}
      teachers={teachers}
      rows={filteredRows}
      headers={headers}
      statusLabels={statusLabels}
      detailsLabel={t("admin.details")}
      emptyMessage={t("admin.noClasses")}
      showingText={showingText}
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
