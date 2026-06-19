"use client";

import { useQuery } from "@apollo/client/react";
// Import MUI icons for the metrics
import {
  AssignmentTurnedInOutlined,
  CalendarToday,
  CancelOutlined,
  CheckCircleOutlineOutlined,
  EventRepeatOutlined,
  GroupAddOutlined,
  HistoryOutlined,
  MenuBookOutlined,
  PendingActionsOutlined,
  PersonOffOutlined,
  QuizOutlined,
  ScienceOutlined,
} from "@mui/icons-material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  dailyScheduleListQueryDocument,
  dailyScheduleMetricsQueryDocument,
} from "@/frontend/graphql/sharedDocuments/schedule.documents";
import { teachersQueryDocument } from "@/frontend/graphql/sharedDocuments/teacher.documents";
import { useDashboardStore } from "@/frontend/stores/dashboardStore";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ClassStatus, MetricItem, ScheduleRow } from "@/frontend/views/dashboard/types/dashboard";
import { DashboardView } from "./DashboardView";
import { useAdminDashboardLabels } from "./utils";

export function AdminDashboardContainer() {
  const t = useTranslations("dashboard");

  // Load user details and RBAC validation hook
  const { hasPermission } = useUserStore();

  // Filter state managed via the new real Zustand store
  const { filters, setDateFilter, setTeacherFilter, setSearchQuery, setSelectedStatus } = useDashboardStore();

  const { headers, statusLabels } = useAdminDashboardLabels();

  // Fetch metrics using active filters
  const {
    data: metricsData,
    loading: loadingMetrics,
    refetch: refetchMetrics,
  } = useQuery(dailyScheduleMetricsQueryDocument, {
    variables: {
      date: filters.date,
      teacherId: filters.teacherId || null,
    },
  });

  // Fetch daily list using active filters
  const {
    data: listData,
    loading: loadingList,
    refetch: refetchList,
  } = useQuery(dailyScheduleListQueryDocument, {
    variables: {
      date: filters.date,
      teacherId: filters.teacherId || null,
      search: filters.searchQuery || null,
    },
  });

  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  // Fetch teachers list using the new teachers query
  const { data: teachersData, loading: loadingTeachers } = useQuery(teachersQueryDocument, {
    variables: {
      search: teacherSearchQuery,
      limit: 10,
    },
  });

  const handleSubmit = () => {
    void refetchMetrics();
    void refetchList();
  };

  const teachers = (teachersData?.teachers ?? []).map(t => ({
    id: t?.id ?? "",
    name: t?.name ?? "",
  }));

  const handleMetricClick = (key: string) => {
    // Enforce dashboard.filter_metrics permission for card clicking
    if (!hasPermission(AppPermission.DashboardFilterMetrics)) {
      return;
    }
    // Toggle the selected status
    if (filters.selectedStatus === key) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(key);
    }
  };

  // Map API metrics back to the required frontend MetricItem[] structure
  const rawMetrics = metricsData?.dailyScheduleMetrics;
  const metricsList: MetricItem[] = [
    { key: "total", count: rawMetrics?.total ?? 0, labelKey: "dashboard.admin.metrics.total", icon: CalendarToday },
    {
      key: "regular",
      count: rawMetrics?.regular ?? 0,
      labelKey: "dashboard.admin.metrics.regular",
      icon: MenuBookOutlined,
    },
    { key: "trial", count: rawMetrics?.trial ?? 0, labelKey: "dashboard.admin.metrics.trial", icon: ScienceOutlined },
    {
      key: "evaluation",
      count: rawMetrics?.advance ?? 0,
      labelKey: "dashboard.admin.metrics.evaluation",
      icon: AssignmentTurnedInOutlined,
    },
    {
      key: "makeup",
      count: rawMetrics?.running ?? 0,
      labelKey: "dashboard.admin.metrics.makeup",
      icon: HistoryOutlined,
    },
    {
      key: "testing",
      count: rawMetrics?.activated ?? 0,
      labelKey: "dashboard.admin.metrics.testing",
      icon: QuizOutlined,
    },
    {
      key: "pending",
      count: rawMetrics?.pending ?? 0,
      labelKey: "dashboard.admin.metrics.pending",
      icon: PendingActionsOutlined,
    },
    {
      key: "done",
      count: rawMetrics?.taken ?? 0,
      labelKey: "dashboard.admin.metrics.done",
      icon: CheckCircleOutlineOutlined,
    },
    {
      key: "rescheduled",
      count: rawMetrics?.rescheduled ?? 0,
      labelKey: "dashboard.admin.metrics.rescheduled",
      icon: EventRepeatOutlined,
    },
    {
      key: "cancelled",
      count: rawMetrics?.suspended ?? 0,
      labelKey: "dashboard.admin.metrics.cancelled",
      icon: CancelOutlined,
    },
    {
      key: "noShow",
      count: rawMetrics?.absent ?? 0,
      labelKey: "dashboard.admin.metrics.noShow",
      icon: PersonOffOutlined,
    },
    {
      key: "needCover",
      count: rawMetrics?.leave ?? 0,
      labelKey: "dashboard.admin.metrics.needCover",
      icon: GroupAddOutlined,
    },
  ];

  // Map and filter raw schedule list to rows
  const rawList = listData?.dailyScheduleList ?? [];
  const mappedRows: ScheduleRow[] = rawList.map(item => {
    // Determine the status mapping safely
    let status: ClassStatus = "pending";
    if (
      item.status &&
      ["scheduled", "in_progress", "pending", "completed", "cancelled", "absent"].includes(item.status)
    ) {
      status = item.status as ClassStatus;
    }

    return {
      id: item.id ?? "",
      classId: `#CLS-${item.id}`,
      student: item.student?.name ?? "Unknown Student",
      teacher: item.teacher?.name ?? "Unknown Teacher",
      yourTime: item.yourTime ?? "",
      teacherTime: item.teacherTime ?? undefined,
      studentTime: item.studentTime ?? undefined,
      time: item.yourTime ?? "",
      status,
    };
  });

  // Client-side filtering
  const filteredRows = mappedRows.filter(row => {
    // Selected Status card filtering
    if (filters.selectedStatus && filters.selectedStatus !== "total") {
      const statusMapping: Record<string, string> = {
        pending: "pending",
        done: "completed",
        cancelled: "cancelled",
        noShow: "absent",
        scheduled: "scheduled",
        running: "in_progress",
      };

      const targetStatus = statusMapping[filters.selectedStatus];
      if (targetStatus && row.status !== targetStatus) {
        return false;
      }
    }
    return true;
  });

  const showingText = t("admin.showingOf", {
    shown: filteredRows.length,
    total: mappedRows.length,
  });

  const isLoading = loadingMetrics || loadingList;

  return (
    <DashboardView
      todayClassesTitle={t("admin.todayClasses")}
      lastUpdated={t("admin.updatedMinutesAgo")}
      metrics={metricsList}
      onMetricClick={handleMetricClick}
      scheduleTitle={t("admin.scheduleOverview")}
      viewAllLabel={t("admin.viewAll")}
      searchPlaceholder={t("admin.searchPlaceholder")}
      searchValue={filters.searchQuery}
      dateLabel={t("admin.listOfClassesOn")}
      dateValue={filters.date}
      teacherPlaceholder={t("admin.selectTeacher")}
      teacherValue={filters.teacherId}
      submitLabel={t("admin.submit")}
      teachers={teachers}
      loadingTeachers={loadingTeachers}
      teacherSearchValue={teacherSearchQuery}
      onTeacherSearchChange={setTeacherSearchQuery}
      rows={filteredRows}
      headers={headers}
      statusLabels={statusLabels}
      detailsLabel={t("admin.details")}
      emptyMessage={isLoading ? "Loading..." : t("admin.noClasses")}
      showingText={showingText}
      onSearchChange={setSearchQuery}
      onDateChange={setDateFilter}
      onTeacherChange={setTeacherFilter}
      onSubmit={handleSubmit}
    />
  );
}
