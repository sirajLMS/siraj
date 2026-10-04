"use client";

import { Button, CircularProgress, DialogActions } from "@mui/material";
import { FORM_ID } from "@/frontend/common/views/dashboard/accounting/payroll/OverrideDialog.constants";
import type { OverrideDialogViewModel } from "@/frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel";

interface OverrideDialogActionsProps {
  readonly viewModel: OverrideDialogViewModel;
}

/** Cancel and destructive confirm buttons for the override dialog. */
export function OverrideDialogActions({ viewModel }: Readonly<OverrideDialogActionsProps>) {
  const { labels, commonLabels, submitting, canSubmit, onCancel } = viewModel;

  return (
    <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
      <Button
        variant="text"
        onClick={onCancel}
        disabled={submitting}
        sx={theme => ({ color: theme.palette.text.secondary, fontWeight: 700, borderRadius: 1.5 })}
      >
        {commonLabels.cancel}
      </Button>
      <Button
        type="submit"
        form={FORM_ID}
        variant="contained"
        disabled={submitting || !canSubmit}
        aria-busy={submitting}
        sx={theme => ({
          backgroundColor: theme.palette.error.main,
          color: theme.palette.onError,
          fontWeight: 700,
          borderRadius: 1.5,
          "&:hover": { backgroundColor: theme.palette.error.dark },
        })}
      >
        {submitting ? (
          <CircularProgress size={20} sx={theme => ({ color: theme.palette.onError })} />
        ) : (
          labels.override.action
        )}
      </Button>
    </DialogActions>
  );
}
