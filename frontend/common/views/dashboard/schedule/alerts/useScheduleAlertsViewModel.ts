"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import { adminDashboardScheduleQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { useScheduleAlertsStore } from "@/frontend/common/stores/scheduleAlertsStore";
import type {
  AcademicClassRow,
  AlertsMetric,
  ScheduleAlert,
} from "@/frontend/common/views/dashboard/schedule/alerts/types";
import {
  buildMetricLabels,
  buildScheduleLabels,
} from "@/frontend/common/views/dashboard/schedule/alerts/useScheduleAlertsViewModel.labels.helpers";
import {
  buildScheduleAlertMetrics,
  buildScheduleQueryInput,
  mapScheduleRowsToClasses,
  resolveScheduleTotalCount,
} from "@/frontend/common/views/dashboard/schedule/alerts/useScheduleAlertsViewModel.mappers.helpers";
import { useRouter } from "@/shared/i18n/navigation";
import { Translation, useAppTranslation } from "@/shared/locale";

function useScheduleAlertsHandlers(setPage: (page: number) => void, router: ReturnType<typeof useRouter>) {
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  const handleLeave = useCallback(
    (id: string) => {
      router.push(`/schedule/tracking/reschedule?classInstanceId=${id}`);
    },
    [router]
  );

  const handleViewClassAudit = useCallback(
    (id: string) => {
      router.push(`/classes/${id}/audit`);
    },
    [router]
  );

  return { handlePageChange, handleLeave, handleViewClassAudit };
}

interface ScheduleAlertsViewModelParams {
  readonly alerts: ScheduleAlert[];
  readonly metrics: AlertsMetric[];
  readonly metricLabels: Record<string, { label: string; subLabel: string }>;
  readonly classes: AcademicClassRow[];
  readonly totalCount: number | undefined;
  readonly page: number;
  readonly pageSize: number;
  readonly labels: ReturnType<typeof buildScheduleLabels>;
  readonly loading: boolean;
  readonly handlers: ReturnType<typeof useScheduleAlertsHandlers>;
}

function buildScheduleAlertsViewModelResult(params: ScheduleAlertsViewModelParams): ScheduleAlertsViewModel {
  const { handlers, alerts, metrics, metricLabels, classes, totalCount, page, pageSize, labels, loading } = params;
  return {
    alerts,
    metrics,
    metricLabels,
    classes,
    totalClasses: totalCount,
    currentPage: page,
    pageSize,
    labels,
    loading,
    onLeave: handlers.handleLeave,
    onViewClassAudit: handlers.handleViewClassAudit,
    onPageChange: handlers.handlePageChange,
    onDownloadReport: () => {},
    onFilter: () => {},
    onExport: () => {},
  };
}

export interface ScheduleAlertsViewModel {
  readonly alerts: readonly ScheduleAlert[];
  readonly metrics: readonly AlertsMetric[];
  readonly metricLabels: Record<string, { label: string; subLabel: string }>;
  readonly classes: readonly AcademicClassRow[];
  readonly totalClasses?: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly labels: ReturnType<typeof buildScheduleLabels>;
  readonly loading: boolean;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange: (page: number) => void;
  readonly onDownloadReport: () => void;
  readonly onFilter: () => void;
  readonly onExport: () => void;
}

export interface UseScheduleAlertsViewModelProps {
  readonly page?: number;
  readonly pageSize?: number;
}

export function useScheduleAlertsViewModel(): ScheduleAlertsViewModel {
  const t = useAppTranslation(Translation.Dashboard.CoreScheduleAlerts);
  const router = useRouter();

  const page = useScheduleAlertsStore(state => state.page);
  const pageSize = useScheduleAlertsStore(state => state.pageSize);
  const setPage = useScheduleAlertsStore(state => state.setPage);

  const { data, loading } = useQuery(adminDashboardScheduleQueryDocument, {
    variables: { input: buildScheduleQueryInput(page, pageSize) },
    fetchPolicy: "cache-and-network",
  });

  const scheduleResult = data?.adminDashboardSchedule;
  const classes = mapScheduleRowsToClasses(scheduleResult?.rows);
  const totalCount = resolveScheduleTotalCount(scheduleResult);

  const alerts: ScheduleAlert[] = [];

  const metrics = useMemo(() => buildScheduleAlertMetrics(scheduleResult?.metrics), [scheduleResult?.metrics]);

  const labels = buildScheduleLabels(t);
  const metricLabels = buildMetricLabels(metrics, t);

  const handlers = useScheduleAlertsHandlers(setPage, router);

  return buildScheduleAlertsViewModelResult({
    alerts,
    metrics,
    metricLabels,
    classes,
    totalCount,
    page,
    pageSize,
    labels,
    loading,
    handlers,
  });
}
