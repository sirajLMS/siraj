"use client";

import type { PendingReviewsViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";

export type { PendingReviewsViewModel };

export type UsePendingReviewsViewModelProps = PendingReviewsViewModel;

export function usePendingReviewsViewModel(props: Readonly<UsePendingReviewsViewModelProps>): PendingReviewsViewModel {
  return {
    rows: props.rows,
    selectedReport: props.selectedReport,
    rejectDialogOpen: props.rejectDialogOpen,
    rejectReason: props.rejectReason,
    teacherFilter: props.teacherFilter,
    studentFilter: props.studentFilter,
    loading: props.loading,
    approving: props.approving,
    rejecting: props.rejecting,
    labels: props.labels,
    onTeacherFilterChange: props.onTeacherFilterChange,
    onStudentFilterChange: props.onStudentFilterChange,
    onSelectReport: props.onSelectReport,
    onApprove: props.onApprove,
    onOpenRejectDialog: props.onOpenRejectDialog,
    onCloseRejectDialog: props.onCloseRejectDialog,
    onRejectReasonChange: props.onRejectReasonChange,
    onConfirmReject: props.onConfirmReject,
  };
}
