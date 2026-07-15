"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useMemo, useState } from "react";
import {
  approveLessonReportMutationDocument,
  pendingLessonReportsQueryDocument,
  rejectLessonReportMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { usePendingLessonReviewsStore } from "@/frontend/common/stores/pendingLessonReviewsStore";
import { logger } from "@/frontend/common/utils/logger";
import { RejectReportDialog } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/components/RejectReportDialog";
import { PendingReviewsView } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/pendingReviewsView";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { useAppTranslation } from "@/shared/locale/client";

type SnackbarSeverity = "success" | "error";

function useLabels(t: ReturnType<typeof useAppTranslation<"dashboard.supervisorPortal.pendingReviews">>) {
  return useMemo(
    () => ({
      pageTitle: t.pageTitle,
      filterByTeacher: t.filterByTeacher,
      filterByStudent: t.filterByStudent,
      allTeachers: t.allTeachers,
      allStudents: t.allStudents,
      lessonDateColumn: t.lessonDateColumn,
      studentColumn: t.studentColumn,
      teacherColumn: t.teacherColumn,
      attendanceColumn: t.attendanceColumn,
      completionColumn: t.completionColumn,
      submittedAtColumn: t.submittedAtColumn,
      statusColumn: t.statusColumn,
      actionsColumn: t.actionsColumn,
      reviewButton: t.reviewButton,
      approveButton: t.approveButton,
      rejectButton: t.rejectButton,
      rejectDialogTitle: t.rejectDialogTitle,
      rejectReasonLabel: t.rejectReasonLabel,
      rejectReasonPlaceholder: t.rejectReasonPlaceholder,
      rejectConfirm: t.rejectConfirm,
      rejectCancel: t.rejectCancel,
      noPendingReviews: t.noPendingReviews,
      loadingMessage: t.loadingMessage,
    }),
    [t]
  );
}

export function PendingReviewsContainer() {
  const t = useAppTranslation("dashboard.supervisorPortal.pendingReviews");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>("success");

  const teacherFilter = usePendingLessonReviewsStore(s => s.teacherFilter);
  const studentFilter = usePendingLessonReviewsStore(s => s.studentFilter);
  const selectedReportId = usePendingLessonReviewsStore(s => s.selectedReportId);
  const rejectDialogOpen = usePendingLessonReviewsStore(s => s.rejectDialogOpen);
  const rejectReason = usePendingLessonReviewsStore(s => s.rejectReason);
  const setTeacherFilter = usePendingLessonReviewsStore(s => s.setTeacherFilter);
  const setStudentFilter = usePendingLessonReviewsStore(s => s.setStudentFilter);
  const setSelectedReportId = usePendingLessonReviewsStore(s => s.setSelectedReportId);
  const setRejectReason = usePendingLessonReviewsStore(s => s.setRejectReason);
  const setRejectDialogOpen = usePendingLessonReviewsStore(s => s.setRejectDialogOpen);
  const resetRejectDialog = usePendingLessonReviewsStore(s => s.resetRejectDialog);

  const { data, loading, refetch } = useQuery(pendingLessonReportsQueryDocument, {
    variables: {
      teacherId: teacherFilter || null,
      studentId: studentFilter || null,
      paginationArgs: { first: 50, page: 1, after: null, before: null, last: null, maxCount: null, skip: null },
    },
    fetchPolicy: "cache-and-network",
  });

  const [approveReport, { loading: approving }] = useMutation(approveLessonReportMutationDocument);
  const [rejectReport, { loading: rejecting }] = useMutation(rejectLessonReportMutationDocument);

  const rows: PendingReviewRow[] = useMemo(() => {
    const items = data?.pendingLessonReports ?? [];
    return items.map(r => ({
      id: r?.id ?? "",
      classInstanceId: r?.classInstanceId ?? "",
      studentId: r?.studentId ?? "",
      teacherId: r?.teacherId ?? "",
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

  const selectedReport = useMemo(() => rows.find(r => r.id === selectedReportId) ?? null, [rows, selectedReportId]);

  const labels = useLabels(t);

  const handleApprove = async (reportId: string) => {
    if (!reportId) return;
    try {
      await approveReport({ variables: { reportId } });
      await refetch();
      setSnackbarMessage(t.approveButton);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      logger.error("Failed to approve lesson report:", err);
      setSnackbarMessage("Failed to approve report");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
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
      setSnackbarMessage(t.rejectButton);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      logger.error("Failed to reject lesson report:", err);
      setSnackbarMessage("Failed to reject report");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <PendingReviewsView
        rows={rows}
        selectedReport={selectedReport}
        rejectDialogOpen={rejectDialogOpen}
        rejectReason={rejectReason}
        teacherFilter={teacherFilter}
        studentFilter={studentFilter}
        loading={loading}
        approving={approving}
        rejecting={rejecting}
        labels={labels}
        onTeacherFilterChange={setTeacherFilter}
        onStudentFilterChange={setStudentFilter}
        onSelectReport={(report: PendingReviewRow | null) => setSelectedReportId(report?.id ?? null)}
        onApprove={handleApprove}
        onOpenRejectDialog={handleOpenRejectDialog}
        onCloseRejectDialog={resetRejectDialog}
        onRejectReasonChange={setRejectReason}
        onConfirmReject={handleConfirmReject}
      />
      <RejectReportDialog
        open={rejectDialogOpen}
        reason={rejectReason}
        loading={rejecting}
        labels={labels}
        onReasonChange={setRejectReason}
        onClose={resetRejectDialog}
        onConfirm={handleConfirmReject}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
