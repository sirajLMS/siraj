"use client";

import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import {
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
} from "@mui/material";
import { useWatch } from "react-hook-form";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import { DialogPresets } from "@/frontend/common/components/ui/dialog/dialogPresets";
import { CarryoverFormAmountFields } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.amountFields";
import {
  FORM_GRID_SX,
  FORM_ID,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.constants";
import { CarryoverFormIdentityFields } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFormDialog.fields";
import {
  type CarryoverFormRow,
  useCarryoverFormViewModel,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverFormViewModel";

export interface CarryoverFormDialogProps {
  /** Whether the dialog is visible; every open starts a fresh form session. */
  readonly open: boolean;
  /** Carryover snapshot for edit mode; `null` opens the dialog in add mode. */
  readonly row: CarryoverFormRow | null;
  /** Close request raised by Cancel, Escape, backdrop click, or a successful write. */
  readonly onClose: () => void;
  /** Runs after a successful create/update so the host page can refresh its queries. */
  readonly onSaved?: () => void;
}

export function CarryoverFormDialog({ open, row, onClose, onSaved }: Readonly<CarryoverFormDialogProps>) {
  const viewModel = useCarryoverFormViewModel({ open, row, onClose, onSaved });
  const { form, labels } = viewModel;
  // The edit-mode teacher field is read-only, so its helper explains why.
  const teacherLockedHint = viewModel.isEdit ? labels.modal.form.teacherLockedHint : undefined;
  // The payable suffix mirrors the currency selection so the money amount is
  // never read without its unit.
  const selectedCurrencyCode = useWatch({ control: form.control, name: "teacherCurrency" });
  const payableEndAdornment =
    selectedCurrencyCode === null ? undefined : <InputAdornment position="end">{selectedCurrencyCode}</InputAdornment>;

  return (
    <Dialog {...DialogPresets.info} open={open} onClose={viewModel.submitting ? undefined : viewModel.onCancel}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
        {viewModel.title}
        <IconButton
          aria-label={viewModel.commonLabels.ariaClose}
          onClick={viewModel.onCancel}
          disabled={viewModel.submitting}
          size="small"
        >
          <CloseOutlinedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack
          id={FORM_ID}
          component="form"
          // Native constraint validation (required/min/max) would swallow the
          // submit event before the Zod resolver runs, so the form opts out and
          // surfaces the same rules as inline field errors instead.
          noValidate
          sx={FORM_GRID_SX}
          onSubmit={event => {
            event.preventDefault();
            viewModel.onSubmit();
          }}
        >
          <CarryoverFormIdentityFields
            form={form}
            labels={labels}
            submitting={viewModel.submitting}
            isEdit={viewModel.isEdit}
            teacherLockedHint={teacherLockedHint}
          />
          <CarryoverFormAmountFields
            form={form}
            labels={labels}
            submitting={viewModel.submitting}
            payableEndAdornment={payableEndAdornment}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <FilterButton onClick={viewModel.onCancel} disabled={viewModel.submitting}>
          {labels.modal.form.cancel}
        </FilterButton>
        <PrimaryPageAction
          type="submit"
          form={FORM_ID}
          disabled={viewModel.submitting || !viewModel.canSubmit}
          aria-busy={viewModel.submitting}
        >
          {viewModel.submitting ? <CircularProgress size={20} color="inherit" /> : labels.modal.form.submit}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
