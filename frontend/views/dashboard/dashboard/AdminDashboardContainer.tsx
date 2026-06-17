"use client";

import { useTranslations } from "next-intl";
import { useDashboardStore } from "@/frontend/stores/mockDashboardStore";
import type { ClassStatus } from "@/frontend/views/dashboard/types/dashboard";
import { DashboardView } from "./DashboardView";

export function AdminDashboardContainer() {
  const t = useTranslations("dashboard");

  const todayClasses = useDashboardStore(state => state.todayClasses);
  const lastUpdatedKey = useDashboardStore(state => state.lastUpdated);
  const filters = useDashboardStore(state => state.filters);
  const scheduleRows = useDashboardStore(state => state.scheduleRows);
  const setDateFilter = useDashboardStore(state => state.setDateFilter);
  const setTeacherFilter = useDashboardStore(state => state.setTeacherFilter);
  const setSearchQuery = useDashboardStore(state => state.setSearchQuery);

  const handleSubmit = () => {
    // Placeholder for future refetch
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

    if (filters.teacher) {
      const teacherId = filters.teacher.toLowerCase();
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
      onMetricClick={_key => {
        // Handle metric card click if needed
      }}
      scheduleTitle={t("admin.scheduleOverview")}
      searchPlaceholder={t("admin.searchPlaceholder")}
      searchValue={filters.searchQuery}
      dateLabel={t("admin.listOfClassesOn")}
      dateValue={filters.date}
      teacherPlaceholder={t("admin.selectTeacher")}
      teacherValue={filters.teacher}
      submitLabel={t("admin.submit")}
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
