"use client";

import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useId } from "react";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import type { FormDialogShellProps } from "@/frontend/common/components/ui/dialog/types/formDialogShell.types";

export function FormDialogShell({
  open,
  title,
  onClose,
  onSubmit,
  submitting,
  cancelLabel,
  submitLabel,
  submittingLabel,
  fullScreen = false,
  children,
}: Readonly<FormDialogShellProps>) {
  const titleId = useId();

  return (
    <Dialog
      {...DialogPresets.info}
      fullScreen={fullScreen}
      open={open}
      onClose={submitting ? undefined : onClose}
      aria-labelledby={titleId}
    >
      <form onSubmit={submitting ? undefined : onSubmit}>
        <DialogTitle id={titleId} sx={{ typography: "titleLg" }}>
          {title}
        </DialogTitle>
        <DialogContent dividers>{children}</DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={submitting}>
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            aria-busy={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {submitting ? (submittingLabel ?? submitLabel) : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
