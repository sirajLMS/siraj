"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { adminDashboardScheduleQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDashboardStore } from "@/frontend/common/stores/dashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { AdminMetricKey } from "@/frontend/common/types/shared.types";
import { resolveDailyScheduleMetricFilter } from "@/frontend/common/views/dashboard/admin/home/utils/dailyScheduleMetricFilter";
import { useAppTranslation } from "@/shared/locale";

export const ADMIN_DASHBOARD_PAGE_SIZE = 10;

/** Tracks when dashboard data first arrives and computes an elapsed-time label that updates every minute. */
export function useLastUpdatedLabel(data: unknown) {
  const admin = useAppTranslation().dashboardTranslations.admin;

  const [dataArrivedAt, setDataArrivedAt] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState(admin.updatedJustNow);

  useEffect(() => {
    if (data && dataArrivedAt === null) {
      setDataArrivedAt(Date.now());
    }
  }, [data, dataArrivedAt]);

  useEffect(() => {
    if (dataArrivedAt === null) {
      setLastUpdated(admin.updatedJustNow);
      return;
    }
    const computeLabel = () => {
      const elapsedMin = Math.floor((Date.now() - dataArrivedAt) / 60000);
      if (elapsedMin < 1) return admin.updatedJustNow;
      return admin.updatedMinutesAgo(elapsedMin);
    };
    setLastUpdated(computeLabel());
    const interval = setInterval(() => {
      setLastUpdated(computeLabel());
    }, 60000);
    return () => clearInterval(interval);
  }, [dataArrivedAt, admin]);

  return lastUpdated;
}

/** Fetches the admin dashboard schedule with pagination and filter variables derived from the dashboard store. */
export function useAdminScheduleQuery() {
  const { filters } = useDashboardStore();
  const [page, setPage] = useState(0);
  const selectedMetricFilter = resolveDailyScheduleMetricFilter(filters.selectedStatus);

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
          first: ADMIN_DASHBOARD_PAGE_SIZE,
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

  return { dashboardData, loading, refetch, page, setPage };
}

/** Groups the filter-change handlers so they stay cohesive and the container stays small. */
export function useAdminDashboardHandlers(setPage: (p: number) => void) {
  const { hasPermission } = useUserStore();
  const { filters, setDateFilter, setTeacherFilter, setSearchQuery, setSelectedStatus } = useDashboardStore();

  const handleDateChange = (date: string) => {
    setDateFilter(date);
    setPage(0);
  };

  const handleTeacherChange = (teacher: PersonOption | null) => {
    setTeacherFilter(teacher);
    setPage(0);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleMetricClick = (key: string) => {
    if (!hasPermission(AppPermission.DashboardFilterMetrics)) {
      return;
    }
    setPage(0);
    if (filters.selectedStatus === key) {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(key as AdminMetricKey);
    }
  };

  return { filters, handleDateChange, handleTeacherChange, handleSearchChange, handleMetricClick };
}
