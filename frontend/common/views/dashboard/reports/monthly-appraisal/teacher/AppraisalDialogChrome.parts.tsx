"use client";

import { CloseOutlined, SaveOutlined } from "@mui/icons-material";
import { Box, Button, DialogActions, DialogTitle, IconButton, Typography } from "@mui/material";

export function AppraisalDialogHeader({
  studentName,
  monthLabel,
  subtitle,
  onClose,
}: Readonly<{
  studentName: string;
  monthLabel: string;
  subtitle: string;
  onClose: () => void;
}>) {
  return (
    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Box>
        <Typography variant="h6">
          {studentName} — {monthLabel}
        </Typography>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.secondary })}>
          {subtitle}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose} aria-label="close">
        <CloseOutlined fontSize="small" />
      </IconButton>
    </DialogTitle>
  );
}

export function AppraisalDialogActions({
  cancelLabel,
  submitLabel,
  submitting,
  onCancel,
  onSubmit,
}: Readonly<{
  cancelLabel: string;
  submitLabel: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}>) {
  return (
    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button onClick={onCancel} sx={{ textTransform: "none" }}>
        {cancelLabel}
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<SaveOutlined />}
        disabled={submitting}
        onClick={onSubmit}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        {submitLabel}
      </Button>
    </DialogActions>
  );
}
