"use client";

import { CloseOutlined, SendOutlined } from "@mui/icons-material";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from "@mui/material";
import type { StudentParentAppraisalViewModel } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";

/**
 * Feedback modal rendered directly by the Container (not through the lazy tier view)
 * to ensure React state updates propagate to the Dialog `open` prop reliably.
 */
export function ContainerFeedbackModal({
  labels,
  open,
  onClose,
  onSubmit,
  submitting,
  error,
}: Readonly<{
  labels: StudentParentAppraisalViewModel["labels"];
  open: boolean;
  onClose: () => void;
  onSubmit: (body: string) => void;
  submitting: boolean;
  error: string | null;
}>) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {labels.studentParentView.feedbackModal.title}
        <IconButton size="small" onClick={onClose} aria-label="close">
          <CloseOutlined fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          label={labels.studentParentView.feedbackModal.bodyLabel}
          placeholder={labels.studentParentView.feedbackModal.bodyPlaceholder}
          id="appraisal-feedback-body-container"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          {labels.studentParentView.feedbackModal.cancel}
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendOutlined />}
          disabled={submitting}
          onClick={() => {
            const el = document.getElementById("appraisal-feedback-body-container");
            const body = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.value.trim() : "";
            if (body) onSubmit(body);
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          {labels.studentParentView.feedbackModal.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
