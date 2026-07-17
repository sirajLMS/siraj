"use client";

import { Dialog, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { PendingReviewsLabels } from "@/shared/locale";

interface RejectReportDialogMobileProps {
  readonly open: boolean;
  readonly reason: string;
  readonly loading: boolean;
  readonly labels: PendingReviewsLabels;
  readonly onReasonChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function RejectReportDialogMobile({
  open,
  reason,
  loading,
  labels,
  onReasonChange,
  onClose,
  onConfirm,
}: Readonly<RejectReportDialogMobileProps>) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullScreen
      sx={theme => ({
        "& .MuiDialog-paper": {
          backgroundColor: theme.palette.surfaceContainer,
          borderRadius: 0,
        },
      })}
    >
      <DialogTitle
        sx={theme => ({
          backgroundColor: theme.palette.error.main,
          color: theme.palette.onError,
          py: 2,
        })}
      >
        <Typography variant="titleLg">{labels.rejectDialogTitle}</Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={6}
          label={labels.rejectReasonLabel}
          placeholder={labels.rejectReasonPlaceholder}
          value={reason}
          onChange={e => onReasonChange(e.target.value)}
          disabled={loading}
          sx={{ mt: 1 }}
          slotProps={{
            htmlInput: { maxLength: 500 },
          }}
        />
      </DialogContent>
      <DialogContent sx={{ p: 2.5, display: "flex", flexDirection: "row", gap: 1 }}>
        <FilterButton fullWidth onClick={onClose} disabled={loading} sx={{ py: 1.5 }}>
          {labels.rejectCancel}
        </FilterButton>
        <PrimaryPageAction
          fullWidth
          onClick={onConfirm}
          disabled={loading || reason.trim().length === 0}
          sx={theme => ({
            py: 1.5,
            backgroundColor: theme.palette.error.main,
            color: theme.palette.onError,
            "&:hover": { backgroundColor: theme.palette.error.dark },
          })}
        >
          {loading ? "..." : labels.rejectConfirm}
        </PrimaryPageAction>
      </DialogContent>
    </Dialog>
  );
}
