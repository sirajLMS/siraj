"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import {
  approveLessonReportMutationDocument,
  pendingLessonReportsQueryDocument,
  rejectLessonReportMutationDocument,
  studentsDirectoryQueryDocument,
  teacherDirectoryQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { usePendingLessonReviewsStore } from "@/frontend/common/stores/pendingLessonReviewsStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  DirectoryPersonOption,
  PendingReviewRow,
  PendingReviewsSnackbarState,
  PendingReviewsViewModel,
  UsePendingReviewsViewModelProps,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { useAppTranslation } from "@/shared/locale";

export type { PendingReviewsViewModel, UsePendingReviewsViewModelProps };

const EMPTY_SNACKBAR: PendingReviewsSnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

export function usePendingReviewsViewModel(
  _props: Readonly<UsePendingReviewsViewModelProps> = {}
): PendingReviewsViewModel {
  const t = useAppTranslation().dashboardTranslations.supervisorPortalPendingReviews;

  const [snackbar, setSnackbar] = useState<PendingReviewsSnackbarState>(EMPTY_SNACKBAR);

  const teacherFilter = usePendingLessonReviewsStore(s => s.teacherFilter);
  const studentFilter = usePendingLessonReviewsStore(s => s.studentFilter);
  const selectedReportId = usePendingLessonReviewsStore(s => s.selectedReportId);
  const rejectDialogOpen = usePendingLessonReviewsStore(s => s.rejectDialogOpen);
  const rejectReason = usePendingLessonReviewsStore(s => s.rejectReason);
  const page = usePendingLessonReviewsStore(s => s.page);
  const pageSize = usePendingLessonReviewsStore(s => s.pageSize);
  const setTeacherFilter = usePendingLessonReviewsStore(s => s.setTeacherFilter);
  const setStudentFilter = usePendingLessonReviewsStore(s => s.setStudentFilter);
  const setSelectedReportId = usePendingLessonReviewsStore(s => s.setSelectedReportId);
  const setRejectReason = usePendingLessonReviewsStore(s => s.setRejectReason);
  const setRejectDialogOpen = usePendingLessonReviewsStore(s => s.setRejectDialogOpen);
  const resetRejectDialog = usePendingLessonReviewsStore(s => s.resetRejectDialog);
  const setPage = usePendingLessonReviewsStore(s => s.setPage);

  const { data, loading, refetch } = useQuery(pendingLessonReportsQueryDocument, {
    variables: {
      teacherId: teacherFilter || null,
      studentId: studentFilter || null,
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        after: null,
        before: null,
        last: null,
        maxCount: null,
        skip: null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: teacherDirectoryData } = useQuery(teacherDirectoryQueryDocument, {
    variables: {
      search: null,
      paginationArgs: {
        first: 100,
        page: 1,
        after: null,
        before: null,
        last: null,
        maxCount: null,
        skip: null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: studentsDirectoryData } = useQuery(studentsDirectoryQueryDocument, {
    variables: { search: null, limit: 100 },
    fetchPolicy: "cache-and-network",
  });

  const [approveReport, { loading: approving }] = useMutation(approveLessonReportMutationDocument);
  const [rejectReport, { loading: rejecting }] = useMutation(rejectLessonReportMutationDocument);

  const rows: PendingReviewRow[] = useMemo(() => {
    const items = data?.pendingLessonReports?.rows ?? [];
    return items.map(r => ({
      id: r?.id ?? "",
      classInstanceId: r?.classInstanceId ?? "",
      studentId: r?.studentId ?? "",
      studentName: r?.studentName ?? "",
      teacherId: r?.teacherId ?? "",
      teacherName: r?.teacherName ?? "",
      lessonDate: r?.lessonDate ?? "",
      durationMinutes: r?.durationMinutes ?? 0,
      attendanceEvaluation: r?.attendanceEvaluation ?? null,
      teacherNotes: r?.teacherNotes ?? "",
      studentNotes: r?.studentNotes ?? "",
      completionPercentage: r?.completionPercentage ?? 0,
      status: r?.status ?? null,
      submittedAt: r?.submittedAt ?? "",
      reviewedAt: r?.reviewedAt ?? "",
      rejectionReason: r?.rejectionReason ?? "",
    }));
  }, [data]);

  const totalCount = data?.pendingLessonReports?.totalCount ?? 0;

  const teacherOptions: DirectoryPersonOption[] = useMemo(() => {
    const directoryRows = teacherDirectoryData?.teacherDirectory?.rows ?? [];
    return directoryRows
      .filter((r): r is NonNullable<typeof r> => Boolean(r?.id))
      .map(r => ({ id: r.id ?? "", name: r.name ?? r.id ?? "" }));
  }, [teacherDirectoryData]);

  const studentOptions: DirectoryPersonOption[] = useMemo(() => {
    const directoryRows = studentsDirectoryData?.studentsDirectory ?? [];
    return directoryRows
      .filter((r): r is NonNullable<typeof r> => Boolean(r?.id))
      .map(r => ({ id: r.id ?? "", name: r.name ?? r.id ?? "" }));
  }, [studentsDirectoryData]);

  const selectedReport = useMemo(() => rows.find(r => r.id === selectedReportId) ?? null, [rows, selectedReportId]);

  const handleApprove = async (reportId: string) => {
    if (!reportId) return;
    try {
      await approveReport({ variables: { reportId } });
      await refetch();
      setSnackbar({ open: true, message: t.approveSuccess, severity: "success" });
    } catch (err) {
      logger.error("Failed to approve lesson report:", err);
      setSnackbar({ open: true, message: t.approveError, severity: "error" });
    }
  };

  const handleOpenRejectDialog = (report: PendingReviewRow) => {
    setSelectedReportId(report.id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedReportId || rejectReason.trim().length === 0) return;
    try {
      await rejectReport({ variables: { reportId: selectedReportId, rejectionReason: rejectReason.trim() } });
      resetRejectDialog();
      await refetch();
      setSnackbar({ open: true, message: t.rejectSuccess, severity: "success" });
    } catch (err) {
      logger.error("Failed to reject lesson report:", err);
      setSnackbar({ open: true, message: t.rejectError, severity: "error" });
    }
  };

  return {
    rows,
    totalCount,
    page,
    pageSize,
    selectedReport,
    rejectDialogOpen,
    rejectReason,
    teacherFilter,
    studentFilter,
    teacherOptions,
    studentOptions,
    loading,
    approving,
    rejecting,
    snackbar,
    labels: t,
    onTeacherFilterChange: setTeacherFilter,
    onStudentFilterChange: setStudentFilter,
    onPageChange: setPage,
    onSelectReport: (report: PendingReviewRow | null) => setSelectedReportId(report?.id ?? null),
    onApprove: handleApprove,
    onOpenRejectDialog: handleOpenRejectDialog,
    onCloseRejectDialog: resetRejectDialog,
    onRejectReasonChange: setRejectReason,
    onConfirmReject: handleConfirmReject,
    onCloseSnackbar: () => setSnackbar(EMPTY_SNACKBAR),
  };
}
