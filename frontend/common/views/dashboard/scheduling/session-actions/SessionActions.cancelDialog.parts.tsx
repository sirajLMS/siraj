"use client";

import { CancelOutlined } from "@mui/icons-material";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { readDialogFieldValue } from "@/frontend/common/views/dashboard/scheduling/session-actions/SessionActions.helpers";
import type { SelfServiceRescheduleLabels } from "@/shared/locale/types/dashboard/scheduling/self-service-reschedule";

export function SessionActionsCancelDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  error,
  labels,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  submitting: boolean;
  error: string | null;
  labels: SelfServiceRescheduleLabels;
}>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CancelOutlined fontSize="small" />
        {labels.cancelConfirm.title}
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary, mb: 2 })}>
          {labels.cancelConfirm.message}
        </Typography>
        <TextField
          id="cancel-reason"
          label={labels.cancelConfirm.reason}
          placeholder={labels.cancelConfirm.reasonPlaceholder}
          multiline
          rows={3}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          {labels.cancelConfirm.cancel}
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<CancelOutlined />}
          disabled={submitting}
          onClick={() => {
            onSubmit(readDialogFieldValue("cancel-reason").trim());
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {labels.cancelConfirm.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
