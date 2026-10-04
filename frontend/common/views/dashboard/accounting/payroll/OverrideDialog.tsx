"use client";

import { Alert, Dialog, DialogContent, DialogTitle, Stack } from "@mui/material";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import { FORM_ID } from "@/frontend/common/views/dashboard/accounting/payroll/OverrideDialog.constants";
import { OverrideDialogActions } from "@/frontend/common/views/dashboard/accounting/payroll/OverrideDialogActions.parts";
import {
  OverrideForceField,
  OverrideNoteField,
  OverridePercentageField,
  OverrideTargetStatusField,
} from "@/frontend/common/views/dashboard/accounting/payroll/OverrideDialogForm.parts";
import { OverrideSummaryCard } from "@/frontend/common/views/dashboard/accounting/payroll/OverrideDialogSummary.parts";
import {
  type OverrideDialogRow,
  useOverrideDialogViewModel,
} from "@/frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel";

export interface OverrideDialogProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Payroll snapshot the override targets; null leaves the summary blank and disables submission. */
  readonly row: OverrideDialogRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful override. */
  readonly onClose: () => void;
  /** Runs after a successful override so the host page can refresh its queries. */
  readonly onApplied?: () => void;
}

/**
 * Manage-only payroll override dialog: shows the current calculation snapshot
 * and collects a target status, optional percentage, note, and force flag.
 */
export function OverrideDialog({ open, row, onClose, onApplied }: Readonly<OverrideDialogProps>) {
  const viewModel = useOverrideDialogViewModel({ open, row, onClose, onApplied });

  return (
    <Dialog {...DialogPresets.info} open={open} onClose={viewModel.submitting ? undefined : viewModel.onCancel}>
      <DialogTitle sx={{ fontWeight: 700 }}>{viewModel.labels.override.title}</DialogTitle>
      <DialogContent>
        <Stack
          id={FORM_ID}
          component="form"
          // Native constraint validation (required/min/max/step) would swallow
          // the submit event with browser bubbles whenever a constraint fails,
          // so the Zod resolver never runs. Validation mirrors the server rules
          // and surfaces as inline field errors instead.
          noValidate
          sx={{ gap: 3, pt: 1 }}
          onSubmit={event => {
            event.preventDefault();
            viewModel.onSubmit();
          }}
        >
          {viewModel.alreadyPaidBlocked ? <Alert severity="error">{viewModel.labels.error.alreadyPaid}</Alert> : null}
          <OverrideSummaryCard viewModel={viewModel} />
          <OverrideTargetStatusField viewModel={viewModel} />
          <OverridePercentageField viewModel={viewModel} />
          <OverrideNoteField viewModel={viewModel} />
          <OverrideForceField viewModel={viewModel} />
        </Stack>
      </DialogContent>
      <OverrideDialogActions viewModel={viewModel} />
    </Dialog>
  );
}
