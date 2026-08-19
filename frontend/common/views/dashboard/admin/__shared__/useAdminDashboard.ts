"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect, useRef, useState } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { adminDashboardScheduleQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useDashboardStore } from "@/frontend/common/stores/dashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { AdminMetricKey } from "@/frontend/common/types/shared.types";
import type { AdminDashboardLastUpdatedLabels } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import { resolveDailyScheduleMetricFilter } from "@/frontend/common/views/dashboard/admin/home/utils/dailyScheduleMetricFilter";

export const ADMIN_DASHBOARD_PAGE_SIZE = 10;

const ADMIN_METRIC_KEYS: readonly AdminMetricKey[] = [
  "total",
  "regular",
  "trial",
  "advance",
  "rescheduled",
  "suspended",
  "taken",
  "pending",
  "activated",
  "running",
  "absent",
  "leave",
];

function isAdminMetricKey(value: string): value is AdminMetricKey {
  return (ADMIN_METRIC_KEYS as readonly string[]).includes(value);
}

/** Tracks when dashboard data first arrives and computes an elapsed-time label that updates every minute. */
export function useLastUpdatedLabel(data: unknown, labels: AdminDashboardLastUpdatedLabels) {
  const dataArrivedAtRef = useRef<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState(labels.updatedJustNow);

  useEffect(() => {
    const computeLabel = (arrivedAt: number) => {
      const elapsedMin = Math.floor((Date.now() - arrivedAt) / 60000);
      if (elapsedMin < 1) return labels.updatedJustNow;
      return labels.updatedMinutesAgo(elapsedMin);
    };

    const update = () => {
      const arrivedAt = dataArrivedAtRef.current;
      if (arrivedAt === null && data) {
        dataArrivedAtRef.current = Date.now();
        setLastUpdated(labels.updatedJustNow);
      } else if (arrivedAt !== null) {
        setLastUpdated(computeLabel(arrivedAt));
      }
    };

    const timeoutId = setTimeout(update, 0);
    const interval = setInterval(update, 60000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [data, labels]);

  return lastUpdated;
}

/** Fetches the admin dashboard schedule with pagination and filter variables derived from the dashboard store. */
export function useAdminScheduleQuery() {
  const { filters } = useDashboardStore();
  const ensureFilterDate = useDashboardStore(s => s.ensureFilterDate);
  const [page, setPage] = useState(0);
  const selectedMetricFilter = resolveDailyScheduleMetricFilter(filters.selectedStatus);

  useEffect(() => {
    ensureFilterDate();
  }, [ensureFilterDate]);

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
    } else if (isAdminMetricKey(key)) {
      setSelectedStatus(key);
    } else {
      setSelectedStatus(null);
    }
  };

  return { filters, handleDateChange, handleTeacherChange, handleSearchChange, handleMetricClick };
}
