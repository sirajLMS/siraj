"use client";

import { ScheduleOutlined, SendOutlined } from "@mui/icons-material";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { readDialogFieldValue } from "@/frontend/common/views/dashboard/scheduling/session-actions/SessionActions.helpers";
import type { SelfServiceRescheduleLabels } from "@/shared/locale/types/dashboard/scheduling/self-service-reschedule";

export function SessionActionsDelayDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  error,
  labels,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  onSubmit: (proposedStartAt: string, reason: string) => void;
  submitting: boolean;
  error: string | null;
  labels: SelfServiceRescheduleLabels;
}>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ScheduleOutlined fontSize="small" />
        {labels.delayModal.title}
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            id="delay-proposed-start"
            label={labels.delayModal.proposedStartAt}
            type="datetime-local"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            id="delay-reason"
            label={labels.delayModal.reason}
            placeholder={labels.delayModal.reasonPlaceholder}
            multiline
            rows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          {labels.delayModal.cancel}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendOutlined />}
          disabled={submitting}
          onClick={() => {
            const dateVal = readDialogFieldValue("delay-proposed-start");
            const reasonVal = readDialogFieldValue("delay-reason");
            if (dateVal) onSubmit(new Date(dateVal).toISOString(), reasonVal.trim());
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {labels.delayModal.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
