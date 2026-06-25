"use client";

import { useQuery } from "@apollo/client/react";
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
import { DashboardView } from "./DashboardView";
import { useAdminDashboardLabels } from "./utils";
import { buildAdminDashboardMetrics } from "./utils/adminDashboardMetrics";
import { resolveDailyScheduleMetricFilter } from "./utils/dailyScheduleMetricFilter";

// Admin Dashboard Container - orchestrates data fetching and state for the admin dashboard view
// This container component handles all GraphQL queries, filter state, and metric/row transformations
export function AdminDashboardContainer() {
  const t = useTranslations("dashboard");

  // Load user details and RBAC validation hook
  const { hasPermission } = useUserStore();

  // Filter state managed via the new real Zustand store (date, teacher, search, selected status)
  const { filters, setDateFilter, setTeacherFilter, setSearchQuery, setSelectedStatus } = useDashboardStore();

  const { headers, statusLabels } = useAdminDashboardLabels();

  const selectedMetricFilter = resolveDailyScheduleMetricFilter(filters.selectedStatus);

  // Fetch metrics using active filters (date and teacherId)
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

  // Fetch daily schedule list using active filters (date, teacherId, search, metric filter)
  const {
    data: listData,
    loading: loadingList,
    refetch: refetchList,
  } = useQuery(dailyScheduleListQueryDocument, {
    variables: {
      date: filters.date,
      teacherId: filters.teacherId || null,
      search: filters.searchQuery || null,
      metricFilter: selectedMetricFilter,
    },
    fetchPolicy: "cache-and-network",
  });

  const [teacherSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const handleDateChange = (date: string) => {
    setDateFilter(date);
    setPage(0);
  };

  const handleTeacherChange = (teacherId: string) => {
    setTeacherFilter(teacherId);
    setPage(0);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  // Fetch teachers list using the new teachers query
  const { data: teachersData } = useQuery(teachersQueryDocument, {
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

  // Handle metric card clicks - enforces DashboardFilterMetrics permission before toggling status selection
  const handleMetricClick = (key: string) => {
    if (!hasPermission(AppPermission.DashboardFilterMetrics)) {
      return;
    }
    setPage(0);
    if (filters.selectedStatus === key) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(key);
    }
  };

  const metricsList = buildAdminDashboardMetrics(metricsData?.dailyScheduleMetrics);

  const rows = listData?.dailyScheduleList ?? [];
  const paginatedRows = rows.slice(page * pageSize, (page + 1) * pageSize);

  const showingText = t("admin.showingOf", {
    shown: paginatedRows.length,
    total: rows.length,
  });

  const isLoading = loadingMetrics || loadingList;

  return (
    <DashboardView
      todayClassesTitle={t("admin.todayClasses")}
      lastUpdated={t("admin.updatedMinutesAgo")}
      metrics={metricsList}
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
      emptyMessage={isLoading ? "Loading..." : t("admin.noClasses")}
      showingText={showingText}
      page={page}
      pageSize={pageSize}
      totalCount={rows.length}
      onPageChange={setPage}
      onSearchChange={handleSearchChange}
      onDateChange={handleDateChange}
      onTeacherChange={handleTeacherChange}
      onSubmit={handleSubmit}
    />
  );
}
