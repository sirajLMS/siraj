"use client";

import { Box } from "@mui/material";
import { PendingReviewActionButtons } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/__shared__";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import type { PendingReviewsLabels } from "@/shared/locale";

type PendingReviewActionsCellProps = Readonly<{
  row: PendingReviewRow;
  labels: Pick<PendingReviewsLabels, "reviewButton" | "approveButton" | "rejectButton">;
  approving: boolean;
  onSelectReport: (row: PendingReviewRow) => void;
  onApprove: (id: string) => void;
  onOpenRejectDialog: (row: PendingReviewRow) => void;
}>;

export function PendingReviewActionsCell({
  row,
  labels,
  approving,
  onSelectReport,
  onApprove,
  onOpenRejectDialog,
}: PendingReviewActionsCellProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, height: "100%" }}>
      <PendingReviewActionButtons
        row={row}
        labels={labels}
        approving={approving}
        onSelect={onSelectReport}
        onApprove={onApprove}
        onReject={onOpenRejectDialog}
      />
    </Box>
  );
}
