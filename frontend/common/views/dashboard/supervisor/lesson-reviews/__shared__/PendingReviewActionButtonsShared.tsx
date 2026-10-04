"use client";

import { CancelOutlined, CheckCircleOutlined, RateReviewOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import type { PendingReviewsLabels } from "@/shared/locale";

/** Review / approve / reject icon actions shared by the desktop cell and mobile card. */
export function PendingReviewActionButtons({
  row,
  labels,
  approving,
  onSelect,
  onApprove,
  onReject,
}: Readonly<{
  readonly row: PendingReviewRow;
  readonly labels: Pick<PendingReviewsLabels, "reviewButton" | "approveButton" | "rejectButton">;
  readonly approving: boolean;
  readonly onSelect: (row: PendingReviewRow) => void;
  readonly onApprove: (id: string) => void;
  readonly onReject: (row: PendingReviewRow) => void;
}>) {
  return (
    <>
      <Tooltip title={labels.reviewButton}>
        <IconButton size="small" aria-label={labels.reviewButton} onClick={() => onSelect(row)}>
          <RateReviewOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={labels.approveButton}>
        <IconButton
          size="small"
          aria-label={labels.approveButton}
          onClick={() => onApprove(row.id)}
          disabled={approving}
          sx={theme => ({ color: theme.palette.primary.main })}
        >
          <CheckCircleOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={labels.rejectButton}>
        <IconButton
          size="small"
          aria-label={labels.rejectButton}
          onClick={() => onReject(row)}
          sx={theme => ({ color: theme.palette.error.main })}
        >
          <CancelOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}
