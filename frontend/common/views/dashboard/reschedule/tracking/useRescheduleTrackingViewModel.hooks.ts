"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import type { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo } from "react";
import type { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  rescheduleTrackingMetricsQueryDocument,
  rescheduleTrackingRowsQueryDocument,
  updateSessionStatusLeaveMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { exportRescheduleTracking } from "@/frontend/common/utils/excel-export/tracking-export";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildTrackingMetrics,
  buildTrackingRows,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import { buildExportLabels } from "@/frontend/common/views/dashboard/reschedule/tracking/useRescheduleTrackingViewModel.helpers";
import type { useRouter } from "@/shared/i18n/navigation";
import type { RescheduleTrackingLabels } from "@/shared/locale/types/dashboard/classes/rescheduleTracking";

export function useTrackingQueries(
  statusFilter: LeaveRequestStatus | null,
  pageSize: number,
  page: number,
  locale: string
) {
  const {
    data: rowsData,
    loading: rowsLoading,
    refetch: refetchRows,
  } = useQuery(rescheduleTrackingRowsQueryDocument, {
    variables: {
      search: null,
      status: statusFilter,
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
    fetchPolicy: "cache-and-network",
  });

  const {
    data: metricsData,
    loading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery(rescheduleTrackingMetricsQueryDocument);

  const metrics = useMemo(
    () => buildTrackingMetrics(metricsData?.rescheduleTrackingMetrics),
    [metricsData?.rescheduleTrackingMetrics]
  );

  const rows = useMemo(
    () => buildTrackingRows(rowsData?.rescheduleTrackingRows?.rows ?? [], locale),
    [rowsData?.rescheduleTrackingRows?.rows, locale]
  );

  const totalCount = rowsData ? (rowsData.rescheduleTrackingRows?.totalCount ?? 0) : undefined;

  return {
    rows,
    metrics,
    totalCount,
    rowsLoading,
    metricsLoading,
    refetchRows,
    refetchMetrics,
  };
}

export function useTrackingHandlers(
  rows: readonly ReturnType<typeof buildTrackingRows>[number][],
  t: RescheduleTrackingLabels,
  router: ReturnType<typeof useRouter>,
  notifications: ReturnType<typeof useNotifications>,
  refetchRows: () => unknown,
  refetchMetrics: () => unknown
) {
  const [approveLeave] = useMutation(updateSessionStatusLeaveMutationDocument);

  const handleApprove = useCallback(
    async (id: string) => {
      const row = rows.find(r => r.id === id);
      if (!row?.originalClassId) {
        notifications.show(t.errors.missingOriginalClassId, { severity: "error", autoHideDuration: 4000 });
        return;
      }
      try {
        await approveLeave({
          variables: {
            classInstanceId: row.originalClassId,
            leaveReason: t.actions.approveLeave,
          },
        });
        notifications.show(t.actions.approveSuccess, { severity: "success", autoHideDuration: 4000 });
        await Promise.all([refetchRows(), refetchMetrics()]);
      } catch (err) {
        logger.error("Failed to approve leave request:", err);
        notifications.show(t.errors.approveFailed, { severity: "error", autoHideDuration: 4000 });
      }
    },
    [rows, approveLeave, notifications, t, refetchRows, refetchMetrics]
  );

  const handleReject = useCallback(
    (id: string) => {
      const row = rows.find(r => r.id === id);
      if (row?.originalClassId) {
        router.push(`/classes/${row.originalClassId}`);
      } else {
        notifications.show(t.errors.missingOriginalClassId, { severity: "error", autoHideDuration: 4000 });
      }
    },
    [rows, router, notifications, t]
  );

  const handleView = useCallback(
    (id: string) => {
      router.push(`/classes/${id}`);
    },
    [router]
  );

  const handleExport = useCallback(() => {
    exportRescheduleTracking({ rows, labels: buildExportLabels(t) }).catch((err: unknown) => {
      logger.error("Excel export failed", err);
    });
  }, [rows, t]);

  return { handleApprove, handleReject, handleView, handleExport };
}
