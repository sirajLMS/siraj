"use client";

import { StyledScheduleSessionCardActions } from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.styles";
import { PendingReviewActionButtons } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/__shared__";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";

interface PendingReviewCardActionsLabels {
  readonly reviewButton: string;
  readonly approveButton: string;
  readonly rejectButton: string;
}

interface PendingReviewCardActionsProps {
  readonly row: PendingReviewRow;
  readonly labels: PendingReviewCardActionsLabels;
  readonly approving: boolean;
  readonly onApprove: (id: string) => void;
  readonly onReject: (row: PendingReviewRow) => void;
  readonly onSelect: (row: PendingReviewRow) => void;
}

export function PendingReviewCardActions({
  row,
  labels,
  approving,
  onApprove,
  onReject,
  onSelect,
}: PendingReviewCardActionsProps) {
  return (
    <StyledScheduleSessionCardActions>
      <PendingReviewActionButtons
        row={row}
        labels={labels}
        approving={approving}
        onSelect={onSelect}
        onApprove={onApprove}
        onReject={onReject}
      />
    </StyledScheduleSessionCardActions>
  );
}
