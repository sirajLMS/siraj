"use client";

import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { adminDashboardScheduleQueryDocument, teachersQueryDocument } from "@/frontend/graphql/sharedDocuments";
import { useDashboardStore } from "@/frontend/stores/dashboardStore";
import { useUserStore } from "@/frontend/stores/userStore";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/admin/home/types/schedule";
import { useAdminDashboardLabels } from "@/frontend/views/dashboard/admin/home/utils";
import { buildAdminDashboardMetrics } from "@/frontend/views/dashboard/admin/home/utils/adminDashboardMetrics";
import { resolveDailyScheduleMetricFilter } from "@/frontend/views/dashboard/admin/home/utils/dailyScheduleMetricFilter";
import { DashboardView } from "@/frontend/views/dashboard/dashboard/DashboardView";

// Admin Dashboard Container - orchestrates data fetching and state for the admin dashboard view
// This container component handles all GraphQL queries, filter state, and metric/row transformations
export function AdminDashboardContainer() {
  const t = useTranslations("dashboard");

  const { hasPermission } = useUserStore();

  const { filters, setDateFilter, setTeacherFilter, setSearchQuery, setSelectedStatus } = useDashboardStore();

  const { headers, statusLabels } = useAdminDashboardLabels();

  const selectedMetricFilter = resolveDailyScheduleMetricFilter(filters.selectedStatus);

  const [teacherSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const {
    data: dashboardData,
    loading,
    refetch,
  } = useQuery(adminDashboardScheduleQueryDocument, {
    variables: {
      input: {
        date: filters.date,
        teacherId: filters.teacherId || null,
        search: filters.searchQuery || null,
        metricFilter: selectedMetricFilter,
        paginationArgs: {
          first: pageSize,
          page: page + 1,
          skip: null,
          after: null,
          before: null,
          last: null,
          maxCount: null,
        },
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const [dataArrivedAt, setDataArrivedAt] = useState<number | null>(null);

  useEffect(() => {
    if (dashboardData && dataArrivedAt === null) {
      setDataArrivedAt(Date.now());
    }
  }, [dashboardData, dataArrivedAt]);

  const [lastUpdated, setLastUpdated] = useState(t("admin.updatedJustNow"));

  useEffect(() => {
    if (dataArrivedAt === null) {
      setLastUpdated(t("admin.updatedJustNow"));
      return;
    }
    const computeLabel = () => {
      const elapsedMin = Math.floor((Date.now() - dataArrivedAt) / 60000);
      if (elapsedMin < 1) return t("admin.updatedJustNow");
      return t("admin.updatedMinutesAgo", { minutes: elapsedMin });
    };
    setLastUpdated(computeLabel());
    const interval = setInterval(() => {
      setLastUpdated(computeLabel());
    }, 60000);
    return () => clearInterval(interval);
  }, [dataArrivedAt, t]);

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

  const { data: teachersData } = useQuery(teachersQueryDocument, {
    variables: {
      search: teacherSearchQuery,
      limit: 10,
    },
  });

  const handleSubmit = () => {
    void refetch();
  };

  const teachers = (teachersData?.teachers ?? []).map(teacher => ({
    id: teacher?.id ?? "",
    name: teacher?.name ?? "",
  }));

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

  const scheduleResult = dashboardData?.adminDashboardSchedule;
  const metricsList = buildAdminDashboardMetrics(scheduleResult?.metrics ?? null);
  const rows = (scheduleResult?.rows ?? []) as unknown as readonly DailyScheduleRow[];
  const totalCount = scheduleResult ? (scheduleResult.pageInfo?.total ?? scheduleResult.totalCount ?? 0) : undefined;

  const selectedMetricLabel = filters.selectedStatus
    ? t(`admin.metrics.${filters.selectedStatus}` as "admin.metrics.total")
    : null;

  return (
    <DashboardView
      loading={loading}
      todayClassesTitle={t("admin.todayClasses")}
      lastUpdated={lastUpdated}
      metrics={metricsList}
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
      rows={rows}
      headers={headers}
      statusLabels={statusLabels}
      detailsLabel={t("admin.details")}
      emptyMessage={loading ? "Loading..." : t("admin.noClasses")}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      onPageChange={setPage}
      onSearchChange={handleSearchChange}
      onDateChange={handleDateChange}
      onTeacherChange={handleTeacherChange}
      onSubmit={handleSubmit}
    />
  );
}
