"use client";

import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo } from "react";
import type { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useRescheduleTrackingStore } from "@/frontend/common/stores/rescheduleTrackingStore";
import type {
  buildTrackingMetrics,
  buildTrackingRows,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import type { RescheduleTrackingViewLabels } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { buildViewLabels } from "@/frontend/common/views/dashboard/reschedule/tracking/useRescheduleTrackingViewModel.helpers";
import {
  useTrackingHandlers,
  useTrackingQueries,
} from "@/frontend/common/views/dashboard/reschedule/tracking/useRescheduleTrackingViewModel.hooks";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

interface RescheduleTrackingViewModel {
  readonly metrics: readonly ReturnType<typeof buildTrackingMetrics>[number][];
  readonly rows: readonly ReturnType<typeof buildTrackingRows>[number][];
  readonly labels: RescheduleTrackingViewLabels;
  readonly loading: boolean;
  readonly totalCount: number | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly statusFilter: LeaveRequestStatus | null;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onView: (id: string) => void;
  readonly onExport: () => void;
  readonly onFilterChange: (status: LeaveRequestStatus | null) => void;
  readonly onPageChange: (page: number) => void;
}

interface UseRescheduleTrackingViewModelProps {
  readonly page?: number;
  readonly pageSize?: number;
}

export function useRescheduleTrackingViewModel(): RescheduleTrackingViewModel {
  const t = useAppTranslation(Translation.Dashboard.RescheduleTracking);
  const locale = useAppLocale();
  const router = useRouter();
  const notifications = useNotifications();

  const page = useRescheduleTrackingStore(state => state.page);
  const pageSize = useRescheduleTrackingStore(state => state.pageSize);
  const statusFilter = useRescheduleTrackingStore(state => state.statusFilter);
  const setStatusFilter = useRescheduleTrackingStore(state => state.setStatusFilter);

  const { rows, metrics, totalCount, rowsLoading, metricsLoading, refetchRows, refetchMetrics } = useTrackingQueries(
    statusFilter,
    pageSize,
    page,
    locale
  );

  const labels = useMemo(() => buildViewLabels(t), [t]);

  const { handleApprove, handleReject, handleView, handleExport } = useTrackingHandlers(
    rows,
    t,
    router,
    notifications,
    refetchRows,
    refetchMetrics
  );

  const handleFilterChange = useCallback(
    (status: LeaveRequestStatus | null) => {
      setStatusFilter(status);
    },
    [setStatusFilter]
  );

  const loading = (rowsLoading && !rows) || (metricsLoading && !metrics);

  return {
    metrics,
    rows,
    labels,
    loading,
    totalCount,
    page,
    pageSize,
    statusFilter,
    onApprove: handleApprove,
    onReject: handleReject,
    onView: handleView,
    onExport: handleExport,
    onFilterChange: handleFilterChange,
    onPageChange: (newPage: number) => {
      useRescheduleTrackingStore.getState().setPage(newPage);
    },
  };
}

export type { RescheduleTrackingViewModel, UseRescheduleTrackingViewModelProps };
