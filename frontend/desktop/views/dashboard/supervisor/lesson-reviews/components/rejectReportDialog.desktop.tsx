"use client";

import type { SxProps } from "@mui/material";
import {
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { DesktopFilterButton, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import type { PendingReviewsLabels } from "@/shared/locale";

interface RejectReportDialogDesktopProps {
  readonly open: boolean;
  readonly reason: string;
  readonly loading: boolean;
  readonly labels: PendingReviewsLabels;
  readonly onReasonChange: (value: string) => void;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function RejectReportDialogDesktop({
  open,
  reason,
  loading,
  labels,
  onReasonChange,
  onClose,
  onConfirm,
}: Readonly<RejectReportDialogDesktopProps>) {
  const confirmSx: SxProps<Theme> = theme => ({
    py: 1.5,
    backgroundColor: theme.palette.error.main,
    color: theme.palette.onError,
    "&:hover": { backgroundColor: theme.palette.error.dark },
  });

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pt: 4 }}>
        <Typography variant="headlineMd">{labels.rejectDialogTitle}</Typography>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={4}
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
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <DesktopFilterButton fullWidth onClick={onClose} disabled={loading} sx={{ py: 1.5 }}>
          {labels.rejectCancel}
        </DesktopFilterButton>
        <DesktopPrimaryPageAction
          fullWidth
          onClick={onConfirm}
          disabled={loading || reason.trim().length === 0}
          sx={confirmSx}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : labels.rejectConfirm}
        </DesktopPrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
