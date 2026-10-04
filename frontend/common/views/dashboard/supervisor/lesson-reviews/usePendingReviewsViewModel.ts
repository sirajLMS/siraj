"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { pendingLessonReportsQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type {
  PendingReviewRow,
  PendingReviewsSnackbarState,
  PendingReviewsViewModel,
  UsePendingReviewsViewModelProps,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import {
  buildPendingReviewsQueryVariables,
  EMPTY_SNACKBAR,
  mapPendingReviewRows,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/usePendingReviewsViewModel.helpers";
import {
  usePendingLessonReviewsStoreState,
  usePendingReviewActions,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/usePendingReviewsViewModel.hooks";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { PendingReviewsViewModel, UsePendingReviewsViewModelProps };

export function usePendingReviewsViewModel(
  _props: Readonly<UsePendingReviewsViewModelProps> = {}
): PendingReviewsViewModel {
  const t = useAppTranslation(Translation.Dashboard.SupervisorPortalPendingReviews);

  const [snackbar, setSnackbar] = useState<PendingReviewsSnackbarState>(EMPTY_SNACKBAR);

  const {
    selectedTeacher,
    studentFilter,
    selectedReportId,
    rejectDialogOpen,
    rejectReason,
    page,
    pageSize,
    setSelectedTeacher,
    setStudentFilter,
    setSelectedReportId,
    setRejectReason,
    setRejectDialogOpen,
    resetRejectDialog,
    setPage,
  } = usePendingLessonReviewsStoreState();

  const { data, loading, refetch } = useQuery(pendingLessonReportsQueryDocument, {
    variables: buildPendingReviewsQueryVariables({
      teacherId: selectedTeacher?.id ?? null,
      studentId: studentFilter?.id ?? null,
      page,
      pageSize,
    }),
    fetchPolicy: "cache-and-network",
  });

  const rows = useMemo(() => mapPendingReviewRows(data), [data]);
  const totalCount = data?.pendingLessonReports?.totalCount ?? 0;
  const selectedReport = useMemo(() => rows.find(r => r.id === selectedReportId) ?? null, [rows, selectedReportId]);

  const { onApprove, onConfirmReject, approving, rejecting } = usePendingReviewActions({
    labels: t,
    refetch,
    showSnackbar: setSnackbar,
    resetRejectDialog,
    selectedReportId,
    rejectReason,
  });

  const handleOpenRejectDialog = (report: PendingReviewRow) => {
    setSelectedReportId(report.id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  return {
    rows,
    totalCount,
    page,
    pageSize,
    selectedReport,
    rejectDialogOpen,
    rejectReason,
    selectedTeacher,
    studentFilter,
    loading,
    approving,
    rejecting,
    snackbar,
    labels: t,
    onSelectedTeacherChange: setSelectedTeacher,
    onStudentFilterChange: setStudentFilter,
    onPageChange: setPage,
    onSelectReport: (report: PendingReviewRow | null) => setSelectedReportId(report?.id ?? null),
    onApprove,
    onOpenRejectDialog: handleOpenRejectDialog,
    onCloseRejectDialog: resetRejectDialog,
    onRejectReasonChange: setRejectReason,
    onConfirmReject,
    onCloseSnackbar: () => setSnackbar(EMPTY_SNACKBAR),
  };
}
