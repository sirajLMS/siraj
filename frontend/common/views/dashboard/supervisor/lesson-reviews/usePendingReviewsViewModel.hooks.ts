import { useMutation } from "@apollo/client/react";
import {
  approveLessonReportMutationDocument,
  rejectLessonReportMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { usePendingLessonReviewsStore } from "@/frontend/common/stores/pendingLessonReviewsStore";
import { logger } from "@/frontend/common/utils/logger";
import type { PendingReviewsSnackbarState } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import type { PendingReviewsLabels } from "@/shared/locale";

type ShowSnackbarFn = (state: PendingReviewsSnackbarState) => void;
type RefetchPendingReviewsFn = () => Promise<unknown>;

export function usePendingLessonReviewsStoreState() {
  const selectedTeacher = usePendingLessonReviewsStore(s => s.selectedTeacher);
  const studentFilter = usePendingLessonReviewsStore(s => s.studentFilter);
  const selectedReportId = usePendingLessonReviewsStore(s => s.selectedReportId);
  const rejectDialogOpen = usePendingLessonReviewsStore(s => s.rejectDialogOpen);
  const rejectReason = usePendingLessonReviewsStore(s => s.rejectReason);
  const page = usePendingLessonReviewsStore(s => s.page);
  const pageSize = usePendingLessonReviewsStore(s => s.pageSize);
  const setSelectedTeacher = usePendingLessonReviewsStore(s => s.setSelectedTeacher);
  const setStudentFilter = usePendingLessonReviewsStore(s => s.setStudentFilter);
  const setSelectedReportId = usePendingLessonReviewsStore(s => s.setSelectedReportId);
  const setRejectReason = usePendingLessonReviewsStore(s => s.setRejectReason);
  const setRejectDialogOpen = usePendingLessonReviewsStore(s => s.setRejectDialogOpen);
  const resetRejectDialog = usePendingLessonReviewsStore(s => s.resetRejectDialog);
  const setPage = usePendingLessonReviewsStore(s => s.setPage);

  return {
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
  };
}

interface UsePendingReviewActionsParams {
  readonly labels: PendingReviewsLabels;
  readonly refetch: RefetchPendingReviewsFn;
  readonly showSnackbar: ShowSnackbarFn;
  readonly resetRejectDialog: () => void;
  readonly selectedReportId: string | null;
  readonly rejectReason: string;
}

export function usePendingReviewActions({
  labels,
  refetch,
  showSnackbar,
  resetRejectDialog,
  selectedReportId,
  rejectReason,
}: UsePendingReviewActionsParams) {
  const [approveReport, { loading: approving }] = useMutation(approveLessonReportMutationDocument);
  const [rejectReport, { loading: rejecting }] = useMutation(rejectLessonReportMutationDocument);

  const onApprove = async (reportId: string) => {
    if (!reportId) return;
    try {
      await approveReport({ variables: { reportId } });
      await refetch();
      showSnackbar({ open: true, message: labels.approveSuccess, severity: "success" });
    } catch (err) {
      logger.error("Failed to approve lesson report:", err);
      showSnackbar({ open: true, message: labels.approveError, severity: "error" });
    }
  };

  const onConfirmReject = async () => {
    if (!selectedReportId || rejectReason.trim().length === 0) return;
    try {
      await rejectReport({ variables: { reportId: selectedReportId, rejectionReason: rejectReason.trim() } });
      resetRejectDialog();
      await refetch();
      showSnackbar({ open: true, message: labels.rejectSuccess, severity: "success" });
    } catch (err) {
      logger.error("Failed to reject lesson report:", err);
      showSnackbar({ open: true, message: labels.rejectError, severity: "error" });
    }
  };

  return { onApprove, onConfirmReject, approving, rejecting };
}
